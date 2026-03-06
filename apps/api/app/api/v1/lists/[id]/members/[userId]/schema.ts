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
  patch: {
    summary: 'Update a group member role',
    parameters: z.object({ id: z.string(), userId: z.string() }),
    requestBody: z.object({
      role: GroupMemberRoleSchema,
    }),
    responses: {
      200: z.object({ data: GroupMemberSchema }),
      401: ServerErrorSchema,
      403: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  delete: {
    summary: 'Remove a member from a group',
    parameters: z.object({ id: z.string(), userId: z.string() }),
    responses: {
      200: z.object({ data: z.object({ success: z.boolean() }) }),
      401: ServerErrorSchema,
      403: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
