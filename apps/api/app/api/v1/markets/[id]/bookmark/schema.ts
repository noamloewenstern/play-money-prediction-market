import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  get: {
    summary: 'Check if market is bookmarked',
    security: true,
    parameters: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({ data: z.object({ isBookmarked: z.boolean() }) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Bookmark a market',
    security: true,
    parameters: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  delete: {
    summary: 'Remove bookmark from a market',
    security: true,
    parameters: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
