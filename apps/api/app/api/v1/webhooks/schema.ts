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
  get: {
    summary: 'List webhooks for the authenticated user',
    security: true,
    responses: {
      200: z.object({ data: z.array(WebhookResponseSchema) }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
  post: {
    summary: 'Create a new webhook',
    security: true,
    requestBody: z.object({
      url: z.string().url(),
      events: z.array(WebhookEventTypeSchema).min(1),
    }),
    responses: {
      200: z.object({
        data: WebhookResponseSchema.extend({ secret: z.string() }),
      }),
      401: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
