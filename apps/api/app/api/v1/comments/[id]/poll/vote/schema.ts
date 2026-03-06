import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  post: {
    summary: 'Vote on a comment poll option, will remove vote if same option selected',
    security: true,
    parameters: z.object({ id: z.string() }),
    requestBody: z.object({
      pollId: z.string(),
      optionId: z.string(),
    }),
    responses: {
      200: z.object({ data: z.any() }),
      204: z.object({}),
      400: ServerErrorSchema,
      403: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
