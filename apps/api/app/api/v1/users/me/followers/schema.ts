import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.date(),
})

export default {
  get: {
    summary: 'Get my followers',
    security: true,
    responses: {
      200: z.object({ data: z.array(UserSchema) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
