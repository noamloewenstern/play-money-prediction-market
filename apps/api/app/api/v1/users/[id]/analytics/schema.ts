import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { UserSchema } from '@play-money/database'

const MarketResultSchema = z.object({
  marketId: z.string(),
  marketQuestion: z.string(),
  marketSlug: z.string(),
  pnl: z.number(),
  amountInvested: z.number(),
  returnPercent: z.number(),
  isWin: z.boolean(),
  resolvedAt: z.date().nullable(),
})

const CategoryPnlSchema = z.object({
  tag: z.string(),
  realizedPnl: z.number(),
  unrealizedPnl: z.number(),
  totalPnl: z.number(),
  tradingVolume: z.number(),
  marketCount: z.number(),
})

export default {
  get: {
    summary: 'Get portfolio analytics for a user',
    parameters: UserSchema.pick({ id: true }),
    responses: {
      200: z.object({
        data: z.object({
          summary: z.object({
            totalRealizedPnl: z.number(),
            totalUnrealizedPnl: z.number(),
            totalPnl: z.number(),
            winRate: z.number(),
            avgReturn: z.number(),
            marketsTraded: z.number(),
            marketsResolved: z.number(),
          }),
          categoryBreakdown: z.array(CategoryPnlSchema),
          largestWins: z.array(MarketResultSchema),
          largestLosses: z.array(MarketResultSchema),
          recentResults: z.array(MarketResultSchema),
          platformComparison: z.object({
            userWinRate: z.number(),
            platformAvgWinRate: z.number(),
            userAvgReturn: z.number(),
            platformAvgReturn: z.number(),
            userTradingVolume: z.number(),
            platformAvgTradingVolume: z.number(),
          }),
        }),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
