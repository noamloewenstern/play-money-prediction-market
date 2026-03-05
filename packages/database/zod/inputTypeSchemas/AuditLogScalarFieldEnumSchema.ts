import { z } from 'zod';

export const AuditLogScalarFieldEnumSchema = z.enum(['id','action','actorId','targetType','targetId','before','after','metadata','createdAt']);

export default AuditLogScalarFieldEnumSchema;
