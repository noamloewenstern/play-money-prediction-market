import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  post: {
    summary: 'Track a Claude Code skills installation',
    requestBody: z.object({
      skills: z.array(z.string()),
      cliVersion: z.string().optional(),
    }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
