import db from '@play-money/database'

export async function getWebhookDeliveries({
  webhookId,
  userId,
  cursor,
  limit = 20,
}: {
  webhookId: string
  userId: string
  cursor?: string
  limit?: number
}) {
  const webhook = await db.webhook.findUnique({ where: { id: webhookId } })

  if (!webhook) {
    throw new Error('Webhook not found')
  }

  if (webhook.userId !== userId) {
    throw new Error('Webhook not found')
  }

  const deliveries = await db.webhookDelivery.findMany({
    where: {
      webhookId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  })

  const hasNextPage = deliveries.length > limit
  const results = hasNextPage ? deliveries.slice(0, limit) : deliveries
  const endCursor = results.length > 0 ? results[results.length - 1]!.id : undefined

  return {
    deliveries: results,
    pageInfo: {
      hasNextPage,
      endCursor,
    },
  }
}
