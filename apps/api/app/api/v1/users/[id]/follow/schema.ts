import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

export default {
  get: {
    summary: 'Check if following a user',
    security: true,
    parameters: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({ data: z.object({ isFollowing: z.boolean() }) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Follow a user',
    security: true,
    parameters: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      400: ServerErrorSchema,
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  delete: {
    summary: 'Unfollow a user',
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
