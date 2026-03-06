import { WebhookEventType } from '@prisma/client'
import db from '@play-money/database'

export async function updateWebhook({
  id,
  userId,
  url,
  events,
  isActive,
}: {
  id: string
  userId: string
  url?: string
  events?: Array<WebhookEventType>
  isActive?: boolean
}) {
  const webhook = await db.webhook.findUnique({ where: { id } })

  if (!webhook) {
    throw new Error('Webhook not found')
  }

  if (webhook.userId !== userId) {
    throw new Error('Webhook not found')
  }

  return db.webhook.update({
    where: { id },
    data: {
      ...(url !== undefined ? { url } : {}),
      ...(events !== undefined ? { events } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
