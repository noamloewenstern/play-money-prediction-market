import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { WebhookEventTypeSchema } from '@play-money/database/zod/inputTypeSchemas/WebhookEventTypeSchema'

const WebhookResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  events: z.array(WebhookEventTypeSchema),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export default {
  patch: {
    summary: 'Update a webhook',
    security: true,
    requestBody: z.object({
      url: z.string().url().optional(),
      events: z.array(WebhookEventTypeSchema).min(1).optional(),
      isActive: z.boolean().optional(),
    }),
    responses: {
      200: z.object({ data: WebhookResponseSchema }),
      401: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  delete: {
    summary: 'Delete a webhook',
    security: true,
    responses: {
      204: z.void(),
      401: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
