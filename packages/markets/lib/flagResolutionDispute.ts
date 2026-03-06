import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import db from '@play-money/database'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getMarket } from './getMarket'

const DISPUTE_WINDOW_HOURS = 24

export class DisputeWindowClosedError extends Error {
  constructor() {
    super(`Resolution disputes can only be flagged within ${DISPUTE_WINDOW_HOURS} hours of resolution`)
    this.name = 'DisputeWindowClosedError'
  }
}

export class MarketNotResolvedError extends Error {
  constructor() {
    super('Market has not been resolved')
    this.name = 'MarketNotResolvedError'
  }
}

export class DisputeAlreadyExistsError extends Error {
  constructor() {
    super('You have already flagged a dispute for this market resolution')
    this.name = 'DisputeAlreadyExistsError'
  }
}

export async function flagResolutionDispute({
  userId,
  marketId,
  reason,
}: {
  userId: string
  marketId: string
  reason: string
}) {
  const market = await getMarket({ id: marketId, extended: true })

  if (!market.resolvedAt) {
    throw new MarketNotResolvedError()
  }

  const now = new Date()
  const resolvedAt = new Date(market.resolvedAt)
  const windowEnd = new Date(resolvedAt.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000)

  if (now > windowEnd) {
    throw new DisputeWindowClosedError()
  }

  const resolution = await db.marketResolution.findUnique({ where: { marketId } })
  if (!resolution) {
    throw new MarketNotResolvedError()
  }

  // Check if user already filed a dispute for this resolution
  const existingDispute = await db.resolutionDispute.findFirst({
    where: { marketId, flaggedById: userId },
  })

  if (existingDispute) {
    throw new DisputeAlreadyExistsError()
  }

  const dispute = await db.resolutionDispute.create({
    data: {
      marketId,
      marketResolutionId: resolution.id,
      flaggedById: userId,
      reason,
      status: 'PENDING',
    },
  })

  // Notify the market resolver about the dispute
  await createNotification({
    type: 'RESOLUTION_DISPUTE_FLAGGED',
    actorId: userId,
    marketId,
    groupKey: `dispute:${marketId}`,
    userId: resolution.resolvedById,
    actionUrl: `/questions/${market.id}/${market.slug}`,
  })

  await createAuditLog({
    action: 'RESOLUTION_DISPUTE_CREATE',
    actorId: userId,
    targetType: 'ResolutionDispute',
    targetId: dispute.id,
    before: null,
    after: { status: 'PENDING', reason, marketId },
    metadata: { marketQuestion: market.question },
  })

  return dispute
}
