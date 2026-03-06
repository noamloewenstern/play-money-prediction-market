import Decimal from 'decimal.js'
import db from '@play-money/database'
import { getUserPrimaryAccount } from './getUserPrimaryAccount'

type TagExposure = {
  tag: string
  totalValue: number
  totalCost: number
  pnl: number
  pnlPercent: number
  positionCount: number
  positions: Array<{
    marketId: string
    marketQuestion: string
    optionName: string
    optionColor: string
    value: number
    cost: number
    quantity: number
    pnl: number
    pnlPercent: number
  }>
}

type CorrelatedGroup = {
  tags: Array<string>
  totalValue: number
  positionCount: number
  marketIds: Array<string>
}

type PortfolioExposure = {
  totalValue: number
  totalCost: number
  totalPnl: number
  maxLoss: number
  tagExposures: Array<TagExposure>
  correlatedGroups: Array<CorrelatedGroup>
  untaggedExposure: TagExposure | null
}

export async function getPortfolioExposure({ userId }: { userId: string }): Promise<PortfolioExposure> {
  const userAccount = await getUserPrimaryAccount({ userId })

  const positions = await db.marketOptionPosition.findMany({
    where: {
      accountId: userAccount.id,
      quantity: { gt: new Decimal(0.0001) },
    },
    include: {
      market: true,
      option: true,
    },
  })

  const tagMap = new Map<string, TagExposure>()
  const untaggedPositions: TagExposure['positions'] = []
  let untaggedValue = new Decimal(0)
  let untaggedCost = new Decimal(0)

  // Track which markets share tags for correlation analysis
  const marketTagsMap = new Map<string, Array<string>>()

  for (const pos of positions) {
    const value = new Decimal(pos.value).toNumber()
    const cost = new Decimal(pos.cost).toNumber()
    const quantity = new Decimal(pos.quantity).toNumber()
    const pnl = value - cost
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0

    const posData = {
      marketId: pos.marketId,
      marketQuestion: pos.market.question,
      optionName: pos.option.name,
      optionColor: pos.option.color,
      value,
      cost,
      quantity,
      pnl,
      pnlPercent,
    }

    const tags = pos.market.tags
    marketTagsMap.set(pos.marketId, tags)

    if (tags.length === 0) {
      untaggedPositions.push(posData)
      untaggedValue = untaggedValue.add(value)
      untaggedCost = untaggedCost.add(cost)
    } else {
      for (const tag of tags) {
        const existing = tagMap.get(tag)
        if (existing) {
          existing.totalValue += value
          existing.totalCost += cost
          existing.pnl = existing.totalValue - existing.totalCost
          existing.pnlPercent = existing.totalCost > 0 ? (existing.pnl / existing.totalCost) * 100 : 0
          existing.positionCount += 1
          existing.positions.push(posData)
        } else {
          tagMap.set(tag, {
            tag,
            totalValue: value,
            totalCost: cost,
            pnl,
            pnlPercent,
            positionCount: 1,
            positions: [posData],
          })
        }
      }
    }
  }

  // Build correlated groups: markets that share 2+ tags
  const tagToMarkets = new Map<string, Set<string>>()
  for (const [marketId, tags] of marketTagsMap) {
    for (const tag of tags) {
      const set = tagToMarkets.get(tag) || new Set()
      set.add(marketId)
      tagToMarkets.set(tag, set)
    }
  }

  const correlatedGroups: Array<CorrelatedGroup> = []
  const seenPairs = new Set<string>()

  const tagEntries = Array.from(tagToMarkets.entries())
  for (let i = 0; i < tagEntries.length; i++) {
    for (let j = i + 1; j < tagEntries.length; j++) {
      const [tagA, marketsA] = tagEntries[i]
      const [tagB, marketsB] = tagEntries[j]
      const shared = Array.from(marketsA).filter((m) => marketsB.has(m))
      if (shared.length >= 2) {
        const pairKey = [tagA, tagB].sort().join('|')
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey)
          const groupValue = shared.reduce((sum, marketId) => {
            const marketPositions = positions.filter((p) => p.marketId === marketId)
            return sum + marketPositions.reduce((s, p) => s + new Decimal(p.value).toNumber(), 0)
          }, 0)
          correlatedGroups.push({
            tags: [tagA, tagB],
            totalValue: groupValue,
            positionCount: shared.length,
            marketIds: shared,
          })
        }
      }
    }
  }

  correlatedGroups.sort((a, b) => b.totalValue - a.totalValue)

  const tagExposures = Array.from(tagMap.values()).sort((a, b) => b.totalValue - a.totalValue)

  const totalValue = positions.reduce((sum, p) => sum + new Decimal(p.value).toNumber(), 0)
  const totalCost = positions.reduce((sum, p) => sum + new Decimal(p.cost).toNumber(), 0)

  const untaggedPnl = untaggedValue.sub(untaggedCost).toNumber()

  return {
    totalValue,
    totalCost,
    totalPnl: totalValue - totalCost,
    maxLoss: totalCost,
    tagExposures,
    correlatedGroups: correlatedGroups.slice(0, 10),
    untaggedExposure:
      untaggedPositions.length > 0
        ? {
            tag: 'Untagged',
            totalValue: untaggedValue.toNumber(),
            totalCost: untaggedCost.toNumber(),
            pnl: untaggedPnl,
            pnlPercent: untaggedCost.toNumber() > 0 ? (untaggedPnl / untaggedCost.toNumber()) * 100 : 0,
            positionCount: untaggedPositions.length,
            positions: untaggedPositions,
          }
        : null,
  }
}
