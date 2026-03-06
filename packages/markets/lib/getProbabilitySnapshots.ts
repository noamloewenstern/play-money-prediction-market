import db from '@play-money/database'

export type ProbabilitySnapshotEntry = {
  optionId: string
  probability: number
}

export type ProbabilitySnapshotTimeSeriesItem = {
  startAt: Date
  endAt: Date
  options: Array<{ id: string; probability: number }>
}

export async function getProbabilitySnapshots({
  marketId,
  startAt,
  endAt,
}: {
  marketId: string
  startAt?: Date
  endAt?: Date
}) {
  return db.marketProbabilitySnapshot.findMany({
    where: {
      marketId,
      ...(startAt || endAt
        ? {
            createdAt: {
              ...(startAt ? { gte: startAt } : {}),
              ...(endAt ? { lte: endAt } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getProbabilitySnapshotsTimeSeries({
  marketId,
  startAt,
  endAt = new Date(),
  tickInterval = 1, // in hours
}: {
  marketId: string
  startAt?: Date
  endAt?: Date
  tickInterval?: number
}): Promise<Array<ProbabilitySnapshotTimeSeriesItem>> {
  const rawSnapshots = await db.marketProbabilitySnapshot.findMany({
    where: {
      marketId,
      ...(startAt || endAt
        ? {
            createdAt: {
              ...(startAt ? { gte: startAt } : {}),
              lte: endAt,
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'asc' },
  })

  if (rawSnapshots.length === 0) return []

  const tickIntervalMs = tickInterval * 60 * 60 * 1000
  const firstTime = startAt ?? rawSnapshots[0].createdAt
  const lastTime = endAt
  const numBuckets = Math.max(1, Math.ceil((lastTime.getTime() - firstTime.getTime()) / tickIntervalMs))

  const buckets: Array<{
    startAt: Date
    endAt: Date
    lastSnapshot: Array<ProbabilitySnapshotEntry> | null
  }> = Array.from({ length: numBuckets }, (_, i) => ({
    startAt: new Date(firstTime.getTime() + i * tickIntervalMs),
    endAt: new Date(firstTime.getTime() + (i + 1) * tickIntervalMs),
    lastSnapshot: null,
  }))

  rawSnapshots.forEach((snapshot) => {
    const bucketIndex = Math.floor((snapshot.createdAt.getTime() - firstTime.getTime()) / tickIntervalMs)
    const clampedIndex = Math.max(0, Math.min(bucketIndex, numBuckets - 1))
    // Keep the last snapshot in each bucket
    buckets[clampedIndex].lastSnapshot = snapshot.snapshots as unknown as Array<ProbabilitySnapshotEntry>
  })

  // Fill forward: carry last known snapshot to empty buckets
  let lastKnown: Array<ProbabilitySnapshotEntry> = []
  return buckets.map((bucket) => {
    if (bucket.lastSnapshot !== null) {
      lastKnown = bucket.lastSnapshot
    }
    return {
      startAt: bucket.startAt,
      endAt: bucket.endAt,
      options: lastKnown.map((s) => ({ id: s.optionId, probability: s.probability })),
    }
  })
}
