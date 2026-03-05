import db from '@play-money/database'
import { AuditLogAction } from '@play-money/database'

export async function createAuditLog({
  action,
  actorId,
  targetType,
  targetId,
  before,
  after,
  metadata,
}: {
  action: AuditLogAction
  actorId: string
  targetType: string
  targetId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return db.auditLog.create({
    data: {
      action,
      actorId,
      targetType,
      targetId,
      before: before ?? undefined,
      after: after ?? undefined,
      metadata: metadata ?? undefined,
    },
  })
}
