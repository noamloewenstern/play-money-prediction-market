import { z } from 'zod';
import { WebhookEventTypeSchema } from '../inputTypeSchemas/WebhookEventTypeSchema'

/////////////////////////////////////////
// WEBHOOK SCHEMA
/////////////////////////////////////////

export const WebhookSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  url: z.string().url(),
  secret: z.string(),
  events: z.array(WebhookEventTypeSchema),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Webhook = z.infer<typeof WebhookSchema>

export default WebhookSchema;
