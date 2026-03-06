import { z } from 'zod'
import { ApiEndpoints, ServerErrorSchema } from '@play-money/api-helpers'
import { JsonValueSchema } from '@play-money/database/zod/inputTypeSchemas/JsonValueSchema'

const WebhookDeliveryResponseSchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  eventType: z.string(),
  payload: JsonValueSchema,
  status: z.string(),
  statusCode: z.number().nullable(),
  attempts: z.number(),
  lastError: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export default {
  get: {
    summary: 'List delivery logs for a webhook',
    security: true,
    parameters: z.object({
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(WebhookDeliveryResponseSchema),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().optional(),
        }),
      }),
      401: ServerErrorSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
} as const satisfies ApiEndpoints
