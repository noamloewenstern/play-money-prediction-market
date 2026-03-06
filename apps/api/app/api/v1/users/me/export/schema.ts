import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  get: {
    summary: 'Export user data as CSV or JSON',
    security: true,
    parameters: z.object({
      type: z.enum(['transactions', 'positions', 'markets']),
      format: z.enum(['csv', 'json']).default('csv'),
    }),
    responses: {
      200: z.void(),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
