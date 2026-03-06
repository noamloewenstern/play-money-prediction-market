import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  patch: {
    summary: 'Update the note on a trade journal entry',
    security: true,
    parameters: z.object({ id: z.string() }),
    requestBody: z.object({ note: z.string().max(2000) }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      401: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
