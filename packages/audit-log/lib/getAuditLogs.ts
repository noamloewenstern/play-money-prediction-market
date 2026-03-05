import db from '@play-money/database'
import { AuditLogAction } from '@play-money/database'

export type AuditLogWithActor = Awaited<ReturnType<typeof getAuditLogs>>['auditLogs'][number]

export async function getAuditLogs({
  action,
  actorId,
  targetType,
  targetId,
  cursor,
  limit = 50,
}: {
  action?: AuditLogAction
  actorId?: string
  targetType?: string
  targetId?: string
  cursor?: string
  limit?: number
} = {}) {
  const where = {
    ...(action ? { action } : {}),
    ...(actorId ? { actorId } : {}),
    ...(targetType ? { targetType } : {}),
    ...(targetId ? { targetType, targetId } : {}),
  }

  const auditLogs = await db.auditLog.findMany({
    where: {
      ...where,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  })

  const hasNextPage = auditLogs.length > limit
  const items = hasNextPage ? auditLogs.slice(0, limit) : auditLogs

  return {
    auditLogs: items,
    pageInfo: {
      hasNextPage,
      endCursor: items.length > 0 ? items[items.length - 1].id : undefined,
      total: await db.auditLog.count({ where }),
    },
  }
}
