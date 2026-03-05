import { z } from 'zod';

export const AuditLogActionSchema = z.enum(['MARKET_RESOLVE','MARKET_CANCEL','COMMENT_DELETE','COMMENT_HIDE','USER_SUSPEND','USER_UNSUSPEND','USER_ROLE_CHANGE','BALANCE_ADJUST','RESOLUTION_OVERRIDE','USER_IMPERSONATE']);

export type AuditLogActionType = `${z.infer<typeof AuditLogActionSchema>}`

export default AuditLogActionSchema;
