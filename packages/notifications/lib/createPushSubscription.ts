import db from '@play-money/database'

export async function createPushSubscription({
  userId,
  endpoint,
  p256dh,
  auth,
  userAgent,
}: {
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}) {
  return db.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh, auth, userAgent },
    create: { userId, endpoint, p256dh, auth, userAgent },
  })
}
