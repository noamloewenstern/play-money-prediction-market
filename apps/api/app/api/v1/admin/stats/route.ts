import { NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import db from '@play-money/database'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserById({ id: userId })
    if (!isAdmin({ user })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      totalMarkets,
      activeMarkets,
      resolvedMarkets,
      canceledMarkets,
      totalComments,
      hiddenComments,
      recentTradeCount,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.market.count(),
      db.market.count({ where: { resolvedAt: null, canceledAt: null } }),
      db.market.count({ where: { resolvedAt: { not: null } } }),
      db.market.count({ where: { canceledAt: { not: null } } }),
      db.comment.count(),
      db.comment.count({ where: { hidden: true } }),
      db.transaction.count({
        where: {
          type: { in: ['TRADE_BUY', 'TRADE_SELL'] },
          createdAt: { gte: oneDayAgo },
        },
      }),
    ])

    return NextResponse.json({
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersWeek,
          newThisMonth: newUsersMonth,
        },
        markets: {
          total: totalMarkets,
          active: activeMarkets,
          resolved: resolvedMarkets,
          canceled: canceledMarkets,
        },
        comments: {
          total: totalComments,
          hidden: hiddenComments,
        },
        trades: {
          last24h: recentTradeCount,
        },
      },
    })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
