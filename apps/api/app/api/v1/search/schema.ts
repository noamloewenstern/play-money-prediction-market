import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { MarketSchema, UserSchema, ListSchema } from '@play-money/database'

const CommentSearchResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorUsername: z.string(),
  authorDisplayName: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  entityTitle: z.string(),
  entitySlug: z.string(),
  createdAt: z.coerce.date(),
})

export default {
  get: {
    summary: 'Search for users, markets, lists, and comments',
    parameters: z.object({ query: z.string().optional() }),
    responses: {
      200: z.object({
        data: z.object({
          users: z.array(UserSchema),
          markets: z.array(MarketSchema),
          lists: z.array(ListSchema),
          tags: z.array(z.object({ tag: z.string(), count: z.number() })),
          comments: z.array(CommentSearchResultSchema),
        }),
      }),
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
