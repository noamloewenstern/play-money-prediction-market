import db from '@play-money/database'
import { deliverWebhook } from './deliverWebhook'

export async function retryPendingDeliveries() {
  const pendingDeliveries = await db.webhookDelivery.findMany({
    where: {
      status: 'pending',
      nextRetry: { lte: new Date() },
    },
    take: 50,
    orderBy: { nextRetry: 'asc' },
  })

  await Promise.all(
    pendingDeliveries.map((delivery) => deliverWebhook({ deliveryId: delivery.id }))
  )

  return { processed: pendingDeliveries.length }
}
