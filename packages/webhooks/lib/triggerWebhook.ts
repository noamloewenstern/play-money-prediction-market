import { Prisma, WebhookEventType } from '@prisma/client'
import db from '@play-money/database'
import { deliverWebhook } from './deliverWebhook'

export async function triggerWebhook({
  eventType,
  payload,
  marketId,
  userId,
}: {
  eventType: WebhookEventType
  payload: Record<string, unknown>
  marketId?: string
  userId?: string
}) {
  const webhooks = await db.webhook.findMany({
    where: {
      isActive: true,
      events: { has: eventType },
      ...(userId ? { userId } : {}),
    },
  })

  if (webhooks.length === 0) {
    return
  }

  const eventPayload = {
    event: eventType as string,
    timestamp: new Date().toISOString(),
    data: payload as Prisma.InputJsonValue,
  }

  await Promise.all(
    webhooks.map(async (webhook) => {
      const delivery = await db.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: eventPayload as unknown as Prisma.InputJsonValue,
          status: 'pending',
        },
      })

      // Fire-and-forget delivery
      void deliverWebhook({ deliveryId: delivery.id })
    })
  )
}
