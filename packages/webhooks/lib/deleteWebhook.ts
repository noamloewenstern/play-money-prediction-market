import db from '@play-money/database'

export async function deleteWebhook({ id, userId }: { id: string; userId: string }) {
  const webhook = await db.webhook.findUnique({ where: { id } })

  if (!webhook) {
    throw new Error('Webhook not found')
  }

  if (webhook.userId !== userId) {
    throw new Error('Webhook not found')
  }

  await db.webhook.delete({ where: { id } })
}
