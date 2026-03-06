import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  get: {
    summary: 'Get popular tags',
    parameters: z.object({
      excludeTag: z.string().optional(),
      limit: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({ data: z.array(z.object({ tag: z.string(), count: z.number() })) }),
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
