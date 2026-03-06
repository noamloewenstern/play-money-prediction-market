import { z } from 'zod'
import { ApiEndpoints, createPaginatedResponseSchema, paginationSchema, ServerErrorSchema } from '@play-money/api-helpers'
import { MarketSchema } from '@play-money/database'

export default {
  get: {
    summary: 'Get personalized feed based on followed tags',
    security: true,
    parameters: paginationSchema.optional(),
    responses: {
      200: createPaginatedResponseSchema(MarketSchema),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
