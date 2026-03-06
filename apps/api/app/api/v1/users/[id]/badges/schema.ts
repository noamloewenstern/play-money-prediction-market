import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { UserSchema } from '@play-money/database'

export default {
  get: {
    summary: 'Get badge list for a user',
    parameters: UserSchema.pick({ id: true }),
    responses: {
      200: z.object({
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            earned: z.boolean(),
            earnedAt: z.date().nullable(),
          })
        ),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
