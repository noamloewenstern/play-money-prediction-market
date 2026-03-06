import db from '@play-money/database'
import { createNotification } from './createNotification'
import { isInQuietHours } from './isInQuietHours'

export async function deliverQueuedNotifications() {
  // Find all users with undelivered queued notifications
  const usersWithQueued = await db.queuedNotification.findMany({
    where: { deliveredAt: null },
    select: { recipientId: true },
    distinct: ['recipientId'],
  })

  let delivered = 0
  let skipped = 0

  for (const { recipientId } of usersWithQueued) {
    const stillQuiet = await isInQuietHours({ userId: recipientId })
    if (stillQuiet) {
      skipped++
      continue
    }

    const queued = await db.queuedNotification.findMany({
      where: {
        recipientId,
        deliveredAt: null,
      },
      orderBy: { createdAt: 'asc' },
    })

    for (const item of queued) {
      await createNotification({
        userId: item.recipientId,
        type: item.type,
        actorId: item.actorId,
        actionUrl: item.actionUrl,
        groupKey: item.groupKey,
        marketId: item.marketId ?? undefined,
        marketOptionId: item.marketOptionId ?? undefined,
        transactionId: item.transactionId ?? undefined,
        listId: item.listId ?? undefined,
        commentId: item.commentId ?? undefined,
        parentCommentId: item.parentCommentId ?? undefined,
        commentReactionId: item.commentReactionId ?? undefined,
        skipQuietHoursCheck: true,
      })
    }

    await db.queuedNotification.updateMany({
      where: {
        recipientId,
        deliveredAt: null,
      },
      data: { deliveredAt: new Date() },
    })

    delivered += queued.length
  }

  return { delivered, skipped }
}
