import db from '@play-money/database'

export async function getMarketAlerts({ marketId, userId }: { marketId: string; userId?: string }) {
  return db.probabilityAlert.findMany({
    where: {
      marketId,
      ...(userId ? { userId } : {}),
      isActive: true,
    },
    include: {
      option: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
