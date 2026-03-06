import db from '@play-money/database'
import { createProbabilitySnapshot } from './createProbabilitySnapshot'

export async function snapshotActiveMarkets() {
  // Find all markets that are still active (not resolved, not canceled)
  const activeMarkets = await db.market.findMany({
    where: {
      resolvedAt: null,
      canceledAt: null,
    },
    select: { id: true },
  })

  const results = await Promise.allSettled(
    activeMarkets.map((market) =>
      createProbabilitySnapshot({
        marketId: market.id,
        source: 'CRON',
      })
    )
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return { total: activeMarkets.length, succeeded, failed }
}
