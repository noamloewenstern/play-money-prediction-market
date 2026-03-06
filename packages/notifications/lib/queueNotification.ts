import db from '@play-money/database'
import { CreateNotificationData } from '../types'

export async function queueNotification({
  userId,
  type,
  groupKey,
  actionUrl,
  actorId,
  marketId,
  commentId,
  commentReactionId,
  parentCommentId,
  transactionId,
  marketOptionId,
  listId,
}: {
  userId: string
  actionUrl: string
  groupKey: string
  listId?: string
} & CreateNotificationData) {
  await db.queuedNotification.create({
    data: {
      recipientId: userId,
      type,
      actorId,
      actionUrl,
      marketId,
      marketOptionId,
      transactionId,
      listId,
      commentId,
      parentCommentId,
      commentReactionId,
      groupKey,
    },
  })
}
