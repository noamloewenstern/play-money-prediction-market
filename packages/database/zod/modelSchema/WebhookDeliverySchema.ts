import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'

/////////////////////////////////////////
// WEBHOOK DELIVERY SCHEMA
/////////////////////////////////////////

export const WebhookDeliverySchema = z.object({
  id: z.string().cuid(),
  webhookId: z.string(),
  eventType: z.string(),
  payload: JsonValueSchema,
  status: z.string(),
  statusCode: z.number().int().nullable(),
  attempts: z.number().int(),
  lastError: z.string().nullable(),
  nextRetry: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>

export default WebhookDeliverySchema;
