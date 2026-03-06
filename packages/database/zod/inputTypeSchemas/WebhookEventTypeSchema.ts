import { z } from 'zod';

export const WebhookEventTypeSchema = z.enum(['MARKET_RESOLVED','MARKET_CANCELED','TRADE_EXECUTED','COMMENT_CREATED']);

export type WebhookEventTypeType = `${z.infer<typeof WebhookEventTypeSchema>}`

export default WebhookEventTypeSchema;
