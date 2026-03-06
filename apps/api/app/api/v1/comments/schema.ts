import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { CommentSchema } from '@play-money/database'

const PollSchema = z.object({
  question: z.string().trim().min(1).max(200),
  options: z.array(z.string().trim().min(1).max(100)).min(2).max(4),
  closesAt: z.string().datetime().optional().nullable(),
})

export default {
  post: {
    summary: 'Create a comment on an entity',
    security: true,
    requestBody: CommentSchema.pick({
      content: true,
      parentId: true,
      entityType: true,
      entityId: true,
    }).extend({
      poll: PollSchema.optional(),
    }),
    responses: {
      200: z.object({ data: CommentSchema }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
