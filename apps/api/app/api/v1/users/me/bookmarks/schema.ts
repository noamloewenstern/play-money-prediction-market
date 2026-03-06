import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  get: {
    summary: 'Get bookmarked markets for the current user',
    security: true,
    responses: {
      200: z.object({ data: z.array(z.object({ id: z.string(), marketId: z.string(), createdAt: z.date() }).passthrough()) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
