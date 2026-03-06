import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { UserSchema } from '@play-money/database'

export default {
  get: {
    summary: 'Get calibration score for a user',
    parameters: UserSchema.pick({ id: true }),
    responses: {
      200: z.object({
        data: z.object({
          brierScore: z.number(),
          calibrationScore: z.number(),
          totalPredictions: z.number(),
          resolvedPredictions: z.number(),
          buckets: z.array(
            z.object({
              range: z.string(),
              minProbability: z.number(),
              maxProbability: z.number(),
              predictedAvg: z.number(),
              actualWinRate: z.number(),
              count: z.number(),
            })
          ),
        }),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
