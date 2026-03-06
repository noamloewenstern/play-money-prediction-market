import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { CommentSchema } from '@play-money/database'

const CommentEditEntrySchema = z.object({
  id: z.string(),
  content: z.string(),
  editedAt: z.date(),
  editedBy: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
})

export default {
  get: {
    summary: 'Get edit history for a comment',
    parameters: CommentSchema.pick({ id: true }),
    responses: {
      200: z.object({ data: z.array(CommentEditEntrySchema) }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
