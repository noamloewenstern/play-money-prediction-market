import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { UserSchema } from '@play-money/database'

export default {
  get: {
    summary: 'Get the creator reputation score for a user',
    parameters: UserSchema.pick({ id: true }),
    responses: {
      200: z.object({
        data: z.object({
          score: z.number(),
          totalMarkets: z.number(),
          resolvedMarkets: z.number(),
          canceledMarkets: z.number(),
          breakdown: z.object({
            resolutionRate: z.number(),
            timeliness: z.number(),
            traderAttraction: z.number(),
            volumeGenerated: z.number(),
            communityEngagement: z.number(),
          }),
        }),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
