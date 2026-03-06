import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import db from '@play-money/database'
import { UserNotFoundError } from '@play-money/users/lib/exceptions'
import { getCalibrationScore } from '@play-money/users/lib/getCalibrationScore'
import { getUserBadges } from '@play-money/users/lib/getUserBadges'
import { getUserById } from '@play-money/users/lib/getUserById'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { getUserStats } from '@play-money/users/lib/getUserStats'
import { getUserTotalTimeSeries } from '@play-money/users/lib/getUserTotalTimeSeries'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const { id } = schema.get.parameters.parse(params)

    await getUserById({ id })

    const [userStats, calibration, badges, userAccount, totalTradeCount] = await Promise.all([
      getUserStats({ userId: id }),
      getCalibrationScore({ userId: id }),
      getUserBadges({ userId: id }),
      getUserPrimaryAccount({ userId: id }),
      db.transaction.count({
        where: { initiatorId: id, type: { in: ['TRADE_BUY', 'TRADE_SELL'] }, isReverse: null },
      }),
    ])

    const portfolioHistory = await getUserTotalTimeSeries({
      accountId: userAccount.id,
      tickInterval: 24,
      endAt: new Date(),
    })

    // Compute win rate from portfolio analytics summary (resolved markets won/total)
    const resolvedMarketPnls = await db.transaction.groupBy({
      by: ['marketId'],
      where: {
        initiatorId: id,
        type: 'TRADE_WIN',
        isReverse: null,
        marketId: { not: null },
      },
    })
    const marketsWithWinsCount = resolvedMarketPnls.length

    const resolvedMarketsTraded = await db.transaction.groupBy({
      by: ['marketId'],
      where: {
        initiatorId: id,
        type: 'TRADE_BUY',
        isReverse: null,
        marketId: { not: null },
        market: { resolvedAt: { not: null } },
      },
    })
    const totalResolvedMarketsCount = resolvedMarketsTraded.length
    const winRate = totalResolvedMarketsCount > 0 ? (marketsWithWinsCount / totalResolvedMarketsCount) * 100 : 0

    return NextResponse.json({
      data: {
        stats: {
          marketsCreated: userStats.totalMarkets,
          totalTradeCount,
          netWorth: userStats.netWorth.toNumber(),
          tradingVolume: userStats.tradingVolume.toNumber(),
          activeDayCount: userStats.activeDayCount,
          winRate: Math.round(winRate * 10) / 10,
        },
        calibration,
        badges,
        portfolioHistory,
      },
    })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging

    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
