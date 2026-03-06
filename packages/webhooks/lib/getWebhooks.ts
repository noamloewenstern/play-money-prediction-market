import db from '@play-money/database'

export async function getWebhooks({ userId }: { userId: string }) {
  return db.webhook.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
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
