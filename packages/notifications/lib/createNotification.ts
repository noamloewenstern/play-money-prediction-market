import { v4 as uuidv4 } from 'uuid'
import db from '@play-money/database'
import { CreateNotificationData } from '../types'
import { buildPushPayload, shouldSendPush } from './buildPushPayload'
import { isInQuietHours } from './isInQuietHours'
import { queueNotification } from './queueNotification'
import { sendPushNotification } from './sendPushNotification'

export async function createNotification({
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
  skipQuietHoursCheck = false,
}: {
  userId: string
  actionUrl: string
  groupKey: string
  listId?: string
  skipQuietHoursCheck?: boolean
} & CreateNotificationData) {
  if (!skipQuietHoursCheck) {
    const inQuietHours = await isInQuietHours({ userId })
    if (inQuietHours) {
      await queueNotification({
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
      })
      return
    }
  }

  const isGroupable = ['MARKET_TRADE', 'MARKET_LIQUIDITY_ADDED', 'COMMENT_REACTION', 'REFERRER_BONUS'].includes(type)

  const notification = await db.notification.create({
    data: {
      recipientId: userId,
      type,
      actionUrl,
      actorId,
      content: {},
      marketId,
      commentId,
      commentReactionId,
      parentCommentId,
      transactionId,
      marketOptionId,
      listId,
    },
  })

  const groupingWindowHours = 24 // TODO: Make this configurable by the user

  const now = new Date()
  const groupWindowEnd = new Date(now.getTime() + groupingWindowHours * 60 * 60 * 1000)
  groupWindowEnd.setMinutes(0, 0, 0) // Round to the nearest hour

  if (isGroupable) {
    await db.notificationGroup.upsert({
      where: {
        recipientId_type_groupWindowEnd_groupKey: {
          recipientId: userId,
          type,
          groupWindowEnd,
          groupKey,
        },
      },
      update: {
        count: { increment: 1 },
        lastNotificationId: notification.id,
        updatedAt: now,
      },
      create: {
        recipientId: userId,
        type,
        lastNotificationId: notification.id,
        groupWindowEnd,
        groupKey,
        createdAt: now,
        updatedAt: now,
      },
    })
  } else {
    const uniqueGroupKey = uuidv4()

    await db.notificationGroup.create({
      data: {
        recipientId: userId,
        type,
        lastNotificationId: notification.id,
        groupWindowEnd: now,
        groupKey: uniqueGroupKey,
        createdAt: now,
        updatedAt: now,
      },
    })
  }

  // Fire-and-forget push notification for selected notification types
  if (shouldSendPush(type)) {
    void buildPushPayload(type, { marketId, actionUrl }).then((payload) => {
      if (payload) {
        void sendPushNotification({ userId, ...payload })
      }
    })
  }
}
