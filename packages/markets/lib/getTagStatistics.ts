import { Prisma } from '@prisma/client'
import db from '@play-money/database'

export type TagStatistics = {
  totalMarkets: number
  activeMarkets: number
  resolvedMarkets: number
  totalVolume: number
  totalTraders: number
  avgResolutionDays: number | null
  mostActiveMarket: {
    id: string
    question: string
    slug: string
    uniqueTradersCount: number
  } | null
}

export async function getTagStatistics({ tag }: { tag: string }): Promise<TagStatistics> {
  const now = new Date()

  const [totalMarkets, activeMarkets, resolvedMarkets] = await Promise.all([
    db.market.count({
      where: { tags: { has: tag }, visibility: 'PUBLIC' },
    }),
    db.market.count({
      where: {
        tags: { has: tag },
        visibility: 'PUBLIC',
        closeDate: { gt: now },
        resolvedAt: null,
        canceledAt: null,
      },
    }),
    db.market.count({
      where: { tags: { has: tag }, visibility: 'PUBLIC', resolvedAt: { not: null } },
    }),
  ])

  // Get market IDs with this tag for volume and stats queries
  const markets = await db.market.findMany({
    where: { tags: { has: tag }, visibility: 'PUBLIC' },
    select: {
      id: true,
      question: true,
      slug: true,
      uniqueTradersCount: true,
      createdAt: true,
      resolvedAt: true,
    },
    orderBy: { uniqueTradersCount: 'desc' },
  })

  if (markets.length === 0) {
    return {
      totalMarkets,
      activeMarkets,
      resolvedMarkets,
      totalVolume: 0,
      totalTraders: 0,
      avgResolutionDays: null,
      mostActiveMarket: null,
    }
  }

  const marketIds = markets.map((m) => m.id)

  // Total volume: sum of TRADE_BUY CURRENCY amounts where a user account is the sender
  const volumeResult = await db.$queryRaw<Array<{ total_volume: string }>>`
    SELECT COALESCE(SUM(te.amount), 0) AS total_volume
    FROM "Transaction" t
    JOIN "TransactionEntry" te ON t.id = te."transactionId"
    JOIN "Account" a ON a.id = te."fromAccountId"
    WHERE t."marketId" IN (${Prisma.join(marketIds)})
      AND t.type = 'TRADE_BUY'
      AND te."assetType" = 'CURRENCY'
      AND a.type = 'USER'
  `
  const totalVolume = Math.round(Number(volumeResult[0]?.total_volume ?? 0))

  // Total unique traders across all tag markets
  const totalTraders = markets.reduce((sum, m) => sum + (m.uniqueTradersCount ?? 0), 0)

  // Average resolution time for resolved markets
  const resolvedMarketsList = markets.filter((m) => m.resolvedAt != null)
  let avgResolutionDays: number | null = null
  if (resolvedMarketsList.length > 0) {
    const totalDays = resolvedMarketsList.reduce((sum, m) => {
      const days = (m.resolvedAt!.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      return sum + days
    }, 0)
    avgResolutionDays = Math.round(totalDays / resolvedMarketsList.length)
  }

  // Most active market by unique traders
  const mostActiveMarket = markets[0]
    ? {
        id: markets[0].id,
        question: markets[0].question,
        slug: markets[0].slug,
        uniqueTradersCount: markets[0].uniqueTradersCount ?? 0,
      }
    : null

  return {
    totalMarkets,
    activeMarkets,
    resolvedMarkets,
    totalVolume,
    totalTraders,
    avgResolutionDays,
    mostActiveMarket,
  }
}
