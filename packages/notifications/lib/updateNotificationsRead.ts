import db from '@play-money/database'

export async function updateNotificationsRead({
  userId,
  marketId,
  listId,
  type,
  groupId,
}: {
  userId: string
  marketId?: string
  listId?: string
  type?: string
  groupId?: string
}): Promise<{ count: number; markedAt: string }> {
  const now = new Date()

  const where: Record<string, unknown> = {
    recipientId: userId,
    readAt: null,
  }
  if (marketId) where.marketId = marketId
  if (listId) where.listId = listId
  if (type) where.type = type
  if (groupId) {
    where.groups = { some: { id: groupId } }
  }

  const result = await db.notification.updateMany({
    where,
    data: {
      readAt: now,
    },
  })

  return { count: result.count, markedAt: now.toISOString() }
}

export async function undoNotificationsRead({
  userId,
  markedAt,
  type,
  groupId,
}: {
  userId: string
  markedAt: string
  type?: string
  groupId?: string
}): Promise<number> {
  const where: Record<string, unknown> = {
    recipientId: userId,
    readAt: new Date(markedAt),
  }
  if (type) where.type = type
  if (groupId) {
    where.groups = { some: { id: groupId } }
  }

  const result = await db.notification.updateMany({
    where,
    data: {
      readAt: null,
    },
  })

  return result.count
}
