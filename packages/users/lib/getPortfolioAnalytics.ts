import Decimal from 'decimal.js'
import db from '@play-money/database'
import { getUserPrimaryAccount } from './getUserPrimaryAccount'

type CategoryPnl = {
  tag: string
  realizedPnl: number
  unrealizedPnl: number
  totalPnl: number
  tradingVolume: number
  marketCount: number
}

type MarketResult = {
  marketId: string
  marketQuestion: string
  marketSlug: string
  pnl: number
  amountInvested: number
  returnPercent: number
  isWin: boolean
  resolvedAt: Date | null
}

type PlatformComparison = {
  userWinRate: number
  platformAvgWinRate: number
  userAvgReturn: number
  platformAvgReturn: number
  userTradingVolume: number
  platformAvgTradingVolume: number
}

type PortfolioAnalytics = {
  summary: {
    totalRealizedPnl: number
    totalUnrealizedPnl: number
    totalPnl: number
    winRate: number
    avgReturn: number
    marketsTraded: number
    marketsResolved: number
  }
  categoryBreakdown: Array<CategoryPnl>
  largestWins: Array<MarketResult>
  largestLosses: Array<MarketResult>
  recentResults: Array<MarketResult>
  platformComparison: PlatformComparison
}

async function getMarketPnlForUser(userId: string, userAccountId: string) {
  // Get all markets the user has traded in
  const buyTransactions = await db.transaction.findMany({
    where: {
      initiatorId: userId,
      type: 'TRADE_BUY',
      isReverse: null,
      marketId: { not: null },
    },
    include: {
      entries: true,
      market: {
        select: { id: true, question: true, slug: true, resolvedAt: true, tags: true },
      },
    },
  })

  const marketIds = Array.from(new Set(buyTransactions.map((t) => t.marketId).filter(Boolean))) as Array<string>

  if (marketIds.length === 0) {
    return []
  }

  // For each market, compute total spent (TRADE_BUY) and total received (TRADE_SELL + TRADE_WIN)
  const [sellTransactions, winTransactions, lossTransactions, activePositions] = await Promise.all([
    db.transaction.findMany({
      where: {
        initiatorId: userId,
        type: 'TRADE_SELL',
        isReverse: null,
        marketId: { in: marketIds },
      },
      include: { entries: true },
    }),
    db.transaction.findMany({
      where: {
        initiatorId: userId,
        type: 'TRADE_WIN',
        isReverse: null,
        marketId: { in: marketIds },
      },
      include: { entries: true },
    }),
    db.transaction.findMany({
      where: {
        initiatorId: userId,
        type: 'TRADE_LOSS',
        isReverse: null,
        marketId: { in: marketIds },
      },
      include: { entries: true },
    }),
    db.marketOptionPosition.findMany({
      where: {
        accountId: userAccountId,
        marketId: { in: marketIds },
      },
    }),
  ])

  // Group by market
  const marketMap = new Map<
    string,
    {
      marketId: string
      marketQuestion: string
      marketSlug: string
      resolvedAt: Date | null
      tags: Array<string>
      totalSpent: Decimal
      totalReceived: Decimal
      currentValue: Decimal
    }
  >()

  // Initialize from buy transactions
  for (const tx of buyTransactions) {
    if (!tx.marketId || !tx.market) continue
    const currencyEntry = tx.entries.find(
      (e) => e.assetType === 'CURRENCY' && e.assetId === 'PRIMARY' && e.fromAccountId === userAccountId
    )
    const amount = currencyEntry ? new Decimal(currencyEntry.amount) : new Decimal(0)

    const existing = marketMap.get(tx.marketId)
    if (existing) {
      existing.totalSpent = existing.totalSpent.add(amount)
    } else {
      marketMap.set(tx.marketId, {
        marketId: tx.marketId,
        marketQuestion: tx.market.question,
        marketSlug: tx.market.slug,
        resolvedAt: tx.market.resolvedAt,
        tags: tx.market.tags,
        totalSpent: amount,
        totalReceived: new Decimal(0),
        currentValue: new Decimal(0),
      })
    }
  }

  // Add sell proceeds
  for (const tx of sellTransactions) {
    if (!tx.marketId) continue
    const currencyEntry = tx.entries.find(
      (e) => e.assetType === 'CURRENCY' && e.assetId === 'PRIMARY' && e.toAccountId === userAccountId
    )
    const amount = currencyEntry ? new Decimal(currencyEntry.amount) : new Decimal(0)
    const existing = marketMap.get(tx.marketId)
    if (existing) existing.totalReceived = existing.totalReceived.add(amount)
  }

  // Add win payouts
  for (const tx of winTransactions) {
    if (!tx.marketId) continue
    const currencyEntry = tx.entries.find(
      (e) => e.assetType === 'CURRENCY' && e.assetId === 'PRIMARY' && e.toAccountId === userAccountId
    )
    const amount = currencyEntry ? new Decimal(currencyEntry.amount) : new Decimal(0)
    const existing = marketMap.get(tx.marketId)
    if (existing) existing.totalReceived = existing.totalReceived.add(amount)
  }

  // Loss payouts are absorbed (count as received since they're partial refunds)
  for (const tx of lossTransactions) {
    if (!tx.marketId) continue
    const currencyEntry = tx.entries.find(
      (e) => e.assetType === 'CURRENCY' && e.assetId === 'PRIMARY' && e.toAccountId === userAccountId
    )
    const amount = currencyEntry ? new Decimal(currencyEntry.amount) : new Decimal(0)
    const existing = marketMap.get(tx.marketId)
    if (existing) existing.totalReceived = existing.totalReceived.add(amount)
  }

  // Add current position values for unrealized gains
  for (const pos of activePositions) {
    const existing = marketMap.get(pos.marketId)
    if (existing) {
      existing.currentValue = existing.currentValue.add(new Decimal(pos.value))
    }
  }

  const results: Array<{
    marketId: string
    marketQuestion: string
    marketSlug: string
    resolvedAt: Date | null
    tags: Array<string>
    realizedPnl: number
    unrealizedPnl: number
    totalPnl: number
    amountInvested: number
    returnPercent: number
    isWin: boolean
  }> = []

  for (const data of marketMap.values()) {
    const realizedPnl = data.totalReceived.sub(data.totalSpent).toNumber()
    const unrealizedPnl = data.currentValue.toNumber()
    const totalPnl = realizedPnl + unrealizedPnl
    const amountInvested = data.totalSpent.toNumber()
    const returnPercent = amountInvested > 0 ? (totalPnl / amountInvested) * 100 : 0
    const isWin = totalPnl > 0

    results.push({
      marketId: data.marketId,
      marketQuestion: data.marketQuestion,
      marketSlug: data.marketSlug,
      resolvedAt: data.resolvedAt,
      tags: data.tags,
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      amountInvested,
      returnPercent,
      isWin,
    })
  }

  return results
}

async function getPlatformStats() {
  // Get platform-wide win rate and average return using aggregate queries
  // Sample a subset for performance: look at all resolved markets and their outcomes
  const totalUsers = await db.user.count({
    where: {
      transactions: {
        some: {
          type: 'TRADE_BUY',
          isReverse: null,
        },
      },
    },
  })

  // Get total trading volume across platform
  const totalVolumeResult = await db.transactionEntry.aggregate({
    _sum: { amount: true },
    where: {
      assetType: 'CURRENCY',
      assetId: 'PRIMARY',
      transaction: {
        type: 'TRADE_BUY',
        isReverse: null,
      },
    },
  })

  const totalVolume = new Decimal(totalVolumeResult._sum.amount || 0).toNumber()
  const platformAvgTradingVolume = totalUsers > 0 ? totalVolume / totalUsers : 0

  // Platform win rate: percentage of TRADE_WIN transactions relative to TRADE_BUY initiators
  // Simplified: count users who have at least one TRADE_WIN vs total active traders
  const [usersWithWins, usersWithTrades] = await Promise.all([
    db.user.count({
      where: {
        transactions: {
          some: { type: 'TRADE_WIN', isReverse: null },
        },
      },
    }),
    db.user.count({
      where: {
        transactions: {
          some: { type: { in: ['TRADE_BUY', 'TRADE_SELL'] }, isReverse: null },
        },
      },
    }),
  ])

  const platformAvgWinRate = usersWithTrades > 0 ? (usersWithWins / usersWithTrades) * 100 : 0

  // Platform avg return: total TRADE_WIN payouts / total TRADE_BUY spending
  const [totalWinPayouts, totalBuySpending] = await Promise.all([
    db.transactionEntry.aggregate({
      _sum: { amount: true },
      where: {
        assetType: 'CURRENCY',
        assetId: 'PRIMARY',
        transaction: { type: 'TRADE_WIN', isReverse: null },
      },
    }),
    db.transactionEntry.aggregate({
      _sum: { amount: true },
      where: {
        assetType: 'CURRENCY',
        assetId: 'PRIMARY',
        transaction: { type: 'TRADE_BUY', isReverse: null },
      },
    }),
  ])

  const winPayouts = new Decimal(totalWinPayouts._sum.amount || 0).toNumber()
  const buySpending = new Decimal(totalBuySpending._sum.amount || 0).toNumber()
  const platformAvgReturn = buySpending > 0 ? ((winPayouts - buySpending) / buySpending) * 100 : 0

  return {
    platformAvgWinRate,
    platformAvgReturn,
    platformAvgTradingVolume,
  }
}

export async function getPortfolioAnalytics({ userId }: { userId: string }): Promise<PortfolioAnalytics> {
  const userAccount = await getUserPrimaryAccount({ userId })
  const [marketResults, platformStats] = await Promise.all([
    getMarketPnlForUser(userId, userAccount.id),
    getPlatformStats(),
  ])

  // Summary stats
  const totalRealizedPnl = marketResults.reduce((sum, r) => sum + r.realizedPnl, 0)
  const totalUnrealizedPnl = marketResults.reduce((sum, r) => sum + r.unrealizedPnl, 0)
  const totalPnl = totalRealizedPnl + totalUnrealizedPnl

  const resolvedMarkets = marketResults.filter((r) => r.resolvedAt !== null)
  const marketsWon = resolvedMarkets.filter((r) => r.isWin).length
  const winRate = resolvedMarkets.length > 0 ? (marketsWon / resolvedMarkets.length) * 100 : 0

  const totalInvested = marketResults.reduce((sum, r) => sum + r.amountInvested, 0)
  const avgReturn = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  const tradingVolume = totalInvested

  // Category breakdown by tags
  const categoryMap = new Map<
    string,
    {
      tag: string
      realizedPnl: number
      unrealizedPnl: number
      totalPnl: number
      tradingVolume: number
      marketIds: Set<string>
    }
  >()

  for (const result of marketResults) {
    const tags = result.tags.length > 0 ? result.tags : ['Untagged']
    for (const tag of tags) {
      const existing = categoryMap.get(tag)
      if (existing) {
        existing.realizedPnl += result.realizedPnl
        existing.unrealizedPnl += result.unrealizedPnl
        existing.totalPnl += result.totalPnl
        existing.tradingVolume += result.amountInvested
        existing.marketIds.add(result.marketId)
      } else {
        categoryMap.set(tag, {
          tag,
          realizedPnl: result.realizedPnl,
          unrealizedPnl: result.unrealizedPnl,
          totalPnl: result.totalPnl,
          tradingVolume: result.amountInvested,
          marketIds: new Set([result.marketId]),
        })
      }
    }
  }

  const categoryBreakdown: Array<CategoryPnl> = Array.from(categoryMap.values())
    .map((c) => ({
      tag: c.tag,
      realizedPnl: c.realizedPnl,
      unrealizedPnl: c.unrealizedPnl,
      totalPnl: c.totalPnl,
      tradingVolume: c.tradingVolume,
      marketCount: c.marketIds.size,
    }))
    .sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl))

  // Convert market results to MarketResult type
  const allMarketResults: Array<MarketResult> = marketResults.map((r) => ({
    marketId: r.marketId,
    marketQuestion: r.marketQuestion,
    marketSlug: r.marketSlug,
    pnl: r.totalPnl,
    amountInvested: r.amountInvested,
    returnPercent: r.returnPercent,
    isWin: r.isWin,
    resolvedAt: r.resolvedAt,
  }))

  // Sort for wins and losses
  const sortedByPnl = [...allMarketResults].sort((a, b) => b.pnl - a.pnl)
  const largestWins = sortedByPnl.filter((r) => r.pnl > 0).slice(0, 5)
  const largestLosses = [...sortedByPnl].reverse().filter((r) => r.pnl < 0).slice(0, 5)

  // Recent results - resolved markets sorted by resolution date
  const recentResults = allMarketResults
    .filter((r) => r.resolvedAt !== null)
    .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())
    .slice(0, 10)

  return {
    summary: {
      totalRealizedPnl,
      totalUnrealizedPnl,
      totalPnl,
      winRate,
      avgReturn,
      marketsTraded: marketResults.length,
      marketsResolved: resolvedMarkets.length,
    },
    categoryBreakdown,
    largestWins,
    largestLosses,
    recentResults,
    platformComparison: {
      userWinRate: winRate,
      platformAvgWinRate: platformStats.platformAvgWinRate,
      userAvgReturn: avgReturn,
      platformAvgReturn: platformStats.platformAvgReturn,
      userTradingVolume: tradingVolume,
      platformAvgTradingVolume: platformStats.platformAvgTradingVolume,
    },
  }
}
