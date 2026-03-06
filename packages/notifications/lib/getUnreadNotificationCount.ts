import db from '@play-money/database'
import { isInQuietHours } from './isInQuietHours'

export async function getUnreadNotificationCount({ userId }: { userId: string }): Promise<number> {
  const inQuietHours = await isInQuietHours({ userId })
  if (inQuietHours) {
    return 0
  }

  const unreadCount = await db.notificationGroup.count({
    where: {
      recipientId: userId,
      lastNotification: {
        readAt: null,
      },
    },
  })

  return unreadCount
}
