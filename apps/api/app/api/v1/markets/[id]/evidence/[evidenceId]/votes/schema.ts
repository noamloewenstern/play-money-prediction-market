import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  post: {
    summary: 'Vote on a piece of evidence',
    security: true,
    parameters: z.object({ id: z.string(), evidenceId: z.string() }),
    requestBody: z.object({ isUpvote: z.boolean() }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
