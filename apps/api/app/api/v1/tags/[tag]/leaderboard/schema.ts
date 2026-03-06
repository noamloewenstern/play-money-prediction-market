import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const LeaderboardUserSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable().optional(),
  total: z.number(),
  rank: z.number(),
})

export default {
  get: {
    summary: 'Get the leaderboard for a tag showing top forecasters',
    parameters: z.object({ tag: z.string() }),
    responses: {
      200: z.object({
        data: z.object({
          traders: z.array(LeaderboardUserSchema),
        }),
      }),
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
