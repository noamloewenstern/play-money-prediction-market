import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { AuditLogActionSchema } from '../inputTypeSchemas/AuditLogActionSchema'

/////////////////////////////////////////
// AUDIT LOG SCHEMA
/////////////////////////////////////////

export const AuditLogSchema = z.object({
  action: AuditLogActionSchema,
  id: z.string().cuid(),
  actorId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  before: JsonValueSchema,
  after: JsonValueSchema,
  metadata: JsonValueSchema,
  createdAt: z.coerce.date(),
})

export type AuditLog = z.infer<typeof AuditLogSchema>

export default AuditLogSchema;
