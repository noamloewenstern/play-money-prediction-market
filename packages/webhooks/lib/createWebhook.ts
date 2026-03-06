import * as crypto from 'crypto'
import { WebhookEventType } from '@prisma/client'
import db from '@play-money/database'

const MAX_WEBHOOKS_PER_USER = 10

export async function createWebhook({
  userId,
  url,
  events,
}: {
  userId: string
  url: string
  events: Array<WebhookEventType>
}) {
  const count = await db.webhook.count({ where: { userId } })

  if (count >= MAX_WEBHOOKS_PER_USER) {
    throw new Error(`Maximum of ${MAX_WEBHOOKS_PER_USER} webhooks per user`)
  }

  const secret = crypto.randomBytes(32).toString('hex')

  const webhook = await db.webhook.create({
    data: {
      userId,
      url,
      secret,
      events,
    },
  })

  return { ...webhook, secret }
}
