import { AlertDirection } from '@prisma/client'
import db from '@play-money/database'

export async function createProbabilityAlert({
  userId,
  marketId,
  optionId,
  threshold,
  direction,
}: {
  userId: string
  marketId: string
  optionId: string
  threshold: number
  direction: AlertDirection
}) {
  return db.probabilityAlert.upsert({
    where: {
      userId_marketId_optionId_threshold_direction: {
        userId,
        marketId,
        optionId,
        threshold,
        direction,
      },
    },
    update: {
      isActive: true,
      triggeredAt: null,
    },
    create: {
      userId,
      marketId,
      optionId,
      threshold,
      direction,
    },
  })
}
