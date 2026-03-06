import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { UserSchema } from '@play-money/database'

const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  earned: z.boolean(),
  earnedAt: z.date().nullable(),
})

const CalibrationBucketSchema = z.object({
  range: z.string(),
  minProbability: z.number(),
  maxProbability: z.number(),
  predictedAvg: z.number(),
  actualWinRate: z.number(),
  count: z.number(),
})

const TimeSeriesPointSchema = z.object({
  startAt: z.date(),
  endAt: z.date(),
  balance: z.number(),
  liquidity: z.number(),
  markets: z.number(),
})

export default {
  get: {
    summary: 'Get public statistics and profile for a user',
    parameters: UserSchema.pick({ id: true }),
    responses: {
      200: z.object({
        data: z.object({
          stats: z.object({
            marketsCreated: z.number(),
            totalTradeCount: z.number(),
            netWorth: z.number(),
            tradingVolume: z.number(),
            activeDayCount: z.number(),
            winRate: z.number(),
          }),
          calibration: z.object({
            brierScore: z.number(),
            calibrationScore: z.number(),
            totalPredictions: z.number(),
            resolvedPredictions: z.number(),
            buckets: z.array(CalibrationBucketSchema),
          }),
          badges: z.array(BadgeSchema),
          portfolioHistory: z.array(TimeSeriesPointSchema),
        }),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
