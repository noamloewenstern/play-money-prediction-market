import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { CommentSchema } from '@play-money/database'

export default {
  post: {
    summary: 'Pin a comment to the top of the entity',
    security: true,
    parameters: CommentSchema.pick({ id: true }),
    responses: {
      200: z.object({ data: CommentSchema }),
      400: ServerErrorSchema,
      401: ServerErrorSchema,
      403: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  delete: {
    summary: 'Unpin a comment',
    security: true,
    parameters: CommentSchema.pick({ id: true }),
    responses: {
      200: z.object({ data: CommentSchema }),
      401: ServerErrorSchema,
      403: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
