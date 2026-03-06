import db from '@play-money/database'

export type ProbabilitySnapshotSource = 'TRADE' | 'CRON'

export type ProbabilitySnapshotEntry = {
  optionId: string
  probability: number
}

export async function createProbabilitySnapshot({
  marketId,
  source,
}: {
  marketId: string
  source: ProbabilitySnapshotSource
}) {
  const options = await db.marketOption.findMany({
    where: { marketId },
    select: { id: true, probability: true },
  })

  const snapshots: Array<ProbabilitySnapshotEntry> = options.map((option) => ({
    optionId: option.id,
    probability: option.probability ?? 0,
  }))

  return db.marketProbabilitySnapshot.create({
    data: {
      marketId,
      snapshots: snapshots as object[],
      source,
    },
  })
}
