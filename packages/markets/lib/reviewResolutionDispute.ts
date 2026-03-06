import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import db from '@play-money/database'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getMarket } from './getMarket'
import { resolveMarket } from './resolveMarket'

export class DisputeNotFoundError extends Error {
  constructor() {
    super('Resolution dispute not found')
    this.name = 'DisputeNotFoundError'
  }
}

export class DisputeAlreadyReviewedError extends Error {
  constructor() {
    super('This dispute has already been reviewed')
    this.name = 'DisputeAlreadyReviewedError'
  }
}

export async function reviewResolutionDispute({
  adminId,
  disputeId,
  action,
  reviewNote,
  newOptionId,
  newSupportingLink,
}: {
  adminId: string
  disputeId: string
  action: 'reject' | 'override'
  reviewNote?: string
  newOptionId?: string
  newSupportingLink?: string
}) {
  const dispute = await db.resolutionDispute.findUnique({
    where: { id: disputeId },
    include: {
      market: { select: { id: true, question: true, slug: true, resolvedAt: true, marketResolution: true } },
    },
  })

  if (!dispute) {
    throw new DisputeNotFoundError()
  }

  if (dispute.status !== 'PENDING' && dispute.status !== 'UNDER_REVIEW') {
    throw new DisputeAlreadyReviewedError()
  }

  if (action === 'reject') {
    await db.resolutionDispute.update({
      where: { id: disputeId },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewNote,
        updatedAt: new Date(),
      },
    })

    // Notify the flagger
    await createNotification({
      type: 'RESOLUTION_DISPUTE_REVIEWED',
      actorId: adminId,
      marketId: dispute.marketId,
      groupKey: `dispute-reviewed:${dispute.marketId}`,
      userId: dispute.flaggedById,
      actionUrl: `/questions/${dispute.market.id}/${dispute.market.slug}`,
    })

    await createAuditLog({
      action: 'RESOLUTION_DISPUTE_REJECT',
      actorId: adminId,
      targetType: 'ResolutionDispute',
      targetId: disputeId,
      before: { status: dispute.status },
      after: { status: 'REJECTED', reviewNote },
      metadata: { marketId: dispute.marketId, marketQuestion: dispute.market.question },
    })

    return { action: 'rejected', disputeId }
  }

  // Override resolution
  if (!newOptionId) {
    throw new Error('newOptionId is required for override action')
  }

  const market = await getMarket({ id: dispute.marketId, extended: true })

  // Mark market as unresolved so resolveMarket can re-resolve it
  await db.market.update({
    where: { id: dispute.marketId },
    data: { resolvedAt: null, closedAt: null },
  })

  // Re-resolve with the new option
  await resolveMarket({
    resolverId: adminId,
    marketId: dispute.marketId,
    optionId: newOptionId,
    supportingLink: newSupportingLink,
  })

  await db.resolutionDispute.update({
    where: { id: disputeId },
    data: {
      status: 'OVERRIDDEN',
      reviewedById: adminId,
      reviewNote,
      updatedAt: new Date(),
    },
  })

  // Notify the flagger
  await createNotification({
    type: 'RESOLUTION_DISPUTE_REVIEWED',
    actorId: adminId,
    marketId: dispute.marketId,
    groupKey: `dispute-reviewed:${dispute.marketId}`,
    userId: dispute.flaggedById,
    actionUrl: `/questions/${market.id}/${market.slug}`,
  })

  await createAuditLog({
    action: 'RESOLUTION_DISPUTE_OVERRIDE',
    actorId: adminId,
    targetType: 'ResolutionDispute',
    targetId: disputeId,
    before: { status: dispute.status, originalResolutionId: dispute.market.marketResolution?.resolutionId },
    after: { status: 'OVERRIDDEN', newOptionId, reviewNote },
    metadata: { marketId: dispute.marketId, marketQuestion: dispute.market.question, newSupportingLink },
  })

  return { action: 'overridden', disputeId }
}
