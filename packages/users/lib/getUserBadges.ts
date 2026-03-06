import db from '@play-money/database'

export type Badge = {
  id: string
  name: string
  description: string
  earnedAt: Date | null
  earned: boolean
}

type BadgeDefinition = {
  id: string
  name: string
  description: string
  check: (stats: UserActivityStats) => { earned: boolean; earnedAt?: Date | null }
}

type UserActivityStats = {
  totalBuyTransactions: number
  totalMarkets: number
  totalComments: number
  totalLiquidityDeposits: number
  joinedAt: Date
  firstTradeAt: Date | null
  firstMarketAt: Date | null
  firstCommentAt: Date | null
  firstLiquidityAt: Date | null
  activeDays: number
  followersCount: number
  marketsResolved: number
}

const BADGE_DEFINITIONS: Array<BadgeDefinition> = [
  {
    id: 'first-trade',
    name: 'First Trade',
    description: 'Place your first trade in a prediction market',
    check: (s) => ({ earned: s.firstTradeAt != null, earnedAt: s.firstTradeAt }),
  },
  {
    id: 'market-maker',
    name: 'Market Maker',
    description: 'Create your first prediction market',
    check: (s) => ({ earned: s.firstMarketAt != null, earnedAt: s.firstMarketAt }),
  },
  {
    id: 'commentator',
    name: 'Commentator',
    description: 'Write your first comment',
    check: (s) => ({ earned: s.firstCommentAt != null, earnedAt: s.firstCommentAt }),
  },
  {
    id: 'liquidity-provider',
    name: 'Liquidity Provider',
    description: 'Boost liquidity in a market for the first time',
    check: (s) => ({ earned: s.firstLiquidityAt != null, earnedAt: s.firstLiquidityAt }),
  },
  {
    id: 'active-trader',
    name: 'Active Trader',
    description: 'Place 10 or more trades',
    check: (s) => ({ earned: s.totalBuyTransactions >= 10, earnedAt: null }),
  },
  {
    id: 'veteran-trader',
    name: 'Veteran Trader',
    description: 'Place 50 or more trades',
    check: (s) => ({ earned: s.totalBuyTransactions >= 50, earnedAt: null }),
  },
  {
    id: 'prolific-creator',
    name: 'Prolific Creator',
    description: 'Create 5 or more prediction markets',
    check: (s) => ({ earned: s.totalMarkets >= 5, earnedAt: null }),
  },
  {
    id: 'top-creator',
    name: 'Top Creator',
    description: 'Create 20 or more prediction markets',
    check: (s) => ({ earned: s.totalMarkets >= 20, earnedAt: null }),
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Gain 10 or more followers',
    check: (s) => ({ earned: s.followersCount >= 10, earnedAt: null }),
  },
  {
    id: 'forecaster',
    name: 'Forecaster',
    description: 'Have 5 or more of your markets resolve',
    check: (s) => ({ earned: s.marketsResolved >= 5, earnedAt: null }),
  },
]

async function getUserActivityStats(userId: string): Promise<UserActivityStats> {
  const [user, totalBuyTransactions, totalComments, firstTrade, firstMarket, firstComment, firstLiquidity, followersCount, marketsResolved] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
      db.transaction.count({
        where: { initiatorId: userId, type: 'TRADE_BUY', isReverse: null },
      }),
      db.comment.count({
        where: { authorId: userId },
      }),
      db.transaction.findFirst({
        where: { initiatorId: userId, type: 'TRADE_BUY', isReverse: null },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      db.market.findFirst({
        where: { createdBy: userId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      db.comment.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      db.transaction.findFirst({
        where: { initiatorId: userId, type: 'LIQUIDITY_DEPOSIT', isReverse: null },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      db.userFollow.count({ where: { followingId: userId } }),
      db.market.count({
        where: { createdBy: userId, resolvedAt: { not: null } },
      }),
    ])

  const totalMarkets = await db.market.count({ where: { createdBy: userId } })

  return {
    totalBuyTransactions,
    totalMarkets,
    totalComments,
    totalLiquidityDeposits: firstLiquidity ? 1 : 0,
    joinedAt: user?.createdAt ?? new Date(),
    firstTradeAt: firstTrade?.createdAt ?? null,
    firstMarketAt: firstMarket?.createdAt ?? null,
    firstCommentAt: firstComment?.createdAt ?? null,
    firstLiquidityAt: firstLiquidity?.createdAt ?? null,
    activeDays: 0,
    followersCount,
    marketsResolved,
  }
}

export async function getUserBadges({ userId }: { userId: string }): Promise<Array<Badge>> {
  const stats = await getUserActivityStats(userId)

  return BADGE_DEFINITIONS.map((def) => {
    const result = def.check(stats)
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      earned: result.earned,
      earnedAt: result.earned ? (result.earnedAt ?? null) : null,
    }
  })
}
