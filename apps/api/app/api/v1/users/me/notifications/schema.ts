import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { NotificationGroupSchema } from '@play-money/database'

export default {
  get: {
    summary: 'Get notifications for the current user',
    security: true,
    responses: {
      200: z.object({ data: z.object({ notifications: z.array(NotificationGroupSchema), unreadCount: z.number() }) }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Mark notifications as read with optional type/group filter and undo support',
    security: true,
    responses: {
      200: z.object({
        data: z.object({ success: z.boolean(), count: z.number().optional(), markedAt: z.string().optional() }),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
