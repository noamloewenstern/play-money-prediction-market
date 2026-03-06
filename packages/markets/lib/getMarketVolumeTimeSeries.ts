import db from '@play-money/database'

export type VolumeTimeSeriesItem = {
  startAt: Date
  endAt: Date
  volume: number
  tradeCount: number
}

export async function getMarketVolumeTimeSeries({
  marketId,
  startAt,
  endAt = new Date(),
  tickInterval = 1, // in hours
}: {
  marketId: string
  startAt?: Date
  endAt?: Date
  tickInterval?: number
}): Promise<Array<VolumeTimeSeriesItem>> {
  const transactions = await db.transaction.findMany({
    where: {
      marketId,
      type: { in: ['TRADE_BUY', 'TRADE_SELL'] },
      isReverse: null,
      createdAt: {
        ...(startAt ? { gte: startAt } : {}),
        lte: endAt,
      },
    },
    include: {
      entries: {
        where: { assetType: 'CURRENCY', assetId: 'PRIMARY' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const effectiveStartAt = startAt ?? (transactions.length > 0 ? transactions[0].createdAt : endAt)
  const tickIntervalMs = tickInterval * 60 * 60 * 1000
  const numBuckets = Math.max(1, Math.ceil((endAt.getTime() - effectiveStartAt.getTime()) / tickIntervalMs))

  const buckets: Array<VolumeTimeSeriesItem> = Array.from({ length: numBuckets }, (_, i) => ({
    startAt: new Date(effectiveStartAt.getTime() + i * tickIntervalMs),
    endAt: new Date(effectiveStartAt.getTime() + (i + 1) * tickIntervalMs),
    volume: 0,
    tradeCount: 0,
  }))

  transactions.forEach((tx) => {
    const bucketIndex = Math.floor((tx.createdAt.getTime() - effectiveStartAt.getTime()) / tickIntervalMs)
    if (bucketIndex >= 0 && bucketIndex < numBuckets) {
      buckets[bucketIndex].tradeCount++
      const volumeSum = tx.entries.reduce((sum, entry) => sum + Math.abs(Number(entry.amount)), 0)
      buckets[bucketIndex].volume += volumeSum
    }
  })

  return buckets
}
