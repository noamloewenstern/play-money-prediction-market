import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const MostActiveMarketSchema = z
  .object({
    id: z.string(),
    question: z.string(),
    slug: z.string(),
    uniqueTradersCount: z.number(),
  })
  .nullable()

export default {
  get: {
    summary: 'Get aggregate statistics for a tag',
    parameters: z.object({ tag: z.string() }),
    responses: {
      200: z.object({
        data: z.object({
          totalMarkets: z.number(),
          activeMarkets: z.number(),
          resolvedMarkets: z.number(),
          totalVolume: z.number(),
          totalTraders: z.number(),
          avgResolutionDays: z.number().nullable(),
          mostActiveMarket: MostActiveMarketSchema,
        }),
      }),
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
