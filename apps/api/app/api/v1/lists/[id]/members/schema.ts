import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'

const GroupMemberRoleSchema = z.enum(['OWNER', 'MODERATOR', 'CONTRIBUTOR', 'MEMBER'])

const GroupMemberSchema = z.object({
  id: z.string(),
  listId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable().optional(),
  }),
})

export default {
  get: {
    summary: 'Get members of a group',
    parameters: z.object({ id: z.string() }),
    responses: {
      200: z.object({
        data: z.array(GroupMemberSchema),
      }),
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Add a member to a group',
    parameters: z.object({ id: z.string() }),
    requestBody: z.object({
      userId: z.string().optional(),
      username: z.string().optional(),
      role: GroupMemberRoleSchema.optional(),
    }),
    responses: {
      200: z.object({
        data: GroupMemberSchema,
      }),
      400: ServerErrorSchema,
      401: ServerErrorSchema,
      403: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
