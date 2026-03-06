import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const EvidenceSchema = z.object({
  id: z.string(),
  marketId: z.string(),
  authorId: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string().nullable(),
  evidenceType: z.enum(['FOR', 'AGAINST', 'NEUTRAL']),
  upvoteCount: z.number(),
  downvoteCount: z.number(),
  userVote: z.boolean().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
})

export default {
  get: {
    summary: 'Get evidence for a market',
    parameters: z.object({ id: z.string() }),
    responses: {
      200: z.object({ data: z.array(EvidenceSchema) }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Submit evidence for a market',
    security: true,
    parameters: z.object({ id: z.string() }),
    requestBody: z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(2000),
      url: z.string().url().optional(),
      evidenceType: z.enum(['FOR', 'AGAINST', 'NEUTRAL']).optional(),
    }),
    responses: {
      200: z.object({ data: EvidenceSchema }),
      401: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
