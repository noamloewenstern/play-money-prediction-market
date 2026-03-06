import webPush from 'web-push'
import db from '@play-money/database'

let vapidConfigured = false

function ensureVapidConfigured() {
  if (vapidConfigured) return
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL || 'mailto:admin@playmoney.dev'
  if (publicKey && privateKey) {
    webPush.setVapidDetails(email, publicKey, privateKey)
    vapidConfigured = true
  }
}

export async function sendPushNotification({
  userId,
  title,
  body,
  url,
  icon,
}: {
  userId: string
  title: string
  body: string
  url?: string
  icon?: string
}) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return // VAPID not configured, skip push notifications
  }

  ensureVapidConfigured()

  const subscriptions = await db.pushSubscription.findMany({ where: { userId } })
  if (subscriptions.length === 0) return

  const payload = JSON.stringify({ title, body, url: url || '/', icon: icon || '/icons/icon-192.png' })

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
      } catch (error: unknown) {
        const err = error as { statusCode?: number }
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid, remove it
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        }
      }
    }),
  )
}
