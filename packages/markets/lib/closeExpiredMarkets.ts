import db from '@play-money/database'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getUniqueTraderIds } from './getUniqueTraderIds'

export async function closeExpiredMarkets() {
  const now = new Date()

  const expiredMarkets = await db.market.findMany({
    where: {
      closeDate: { lt: now },
      closedAt: null,
      resolvedAt: null,
      canceledAt: null,
    },
    include: {
      user: true,
      options: true,
    },
  })

  const results = {
    processed: 0,
    failed: 0,
    errors: [] as Array<{ marketId: string; error: string }>,
  }

  for (const market of expiredMarkets) {
    try {
      await db.market.update({
        where: { id: market.id },
        data: { closedAt: now },
      })

      const traderIds = await getUniqueTraderIds(market.id, [])

      const recipientIds = Array.from(new Set([market.createdBy, ...traderIds]))

      await Promise.all(
        recipientIds.map((recipientId) =>
          createNotification({
            type: 'MARKET_CLOSED',
            actorId: market.createdBy,
            marketId: market.id,
            groupKey: market.id,
            userId: recipientId,
            actionUrl: `/questions/${market.id}/${market.slug}`,
          })
        )
      )

      results.processed++
    } catch (error) {
      results.failed++
      results.errors.push({
        marketId: market.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}
