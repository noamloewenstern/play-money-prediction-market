import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  delete: {
    summary: 'Delete a piece of evidence',
    security: true,
    parameters: z.object({ id: z.string(), evidenceId: z.string() }),
    responses: {
      204: z.undefined(),
      401: ServerErrorSchema,
      403: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
