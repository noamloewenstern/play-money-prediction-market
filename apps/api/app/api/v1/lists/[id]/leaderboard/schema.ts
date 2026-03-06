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
    summary: 'Get the leaderboard for a group/list scoped to its markets',
    parameters: z.object({ id: z.string() }),
    responses: {
      200: z.object({
        data: z.object({
          traders: z.array(LeaderboardUserSchema),
        }),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
