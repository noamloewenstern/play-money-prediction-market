import { AuditLogAction, Prisma } from '@prisma/client'
import db from '@play-money/database'

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
  before?: Prisma.InputJsonValue | null
  after?: Prisma.InputJsonValue | null
  metadata?: Prisma.InputJsonValue | null
}) {
  return db.auditLog.create({
    data: {
      action,
      actorId,
      targetType,
      targetId,
      before: before ?? Prisma.JsonNull,
      after: after ?? Prisma.JsonNull,
      metadata: metadata ?? Prisma.JsonNull,
    },
  })
}
