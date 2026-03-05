import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  get: {
    summary: 'Download a Claude Code skill file',
    parameters: z.object({ name: z.string() }),
    responses: {
      200: z.object({ data: z.string() }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
