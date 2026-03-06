import db from '@play-money/database'

export async function getResolutionDisputes({
  status,
  page = 1,
  limit = 20,
}: {
  status?: 'PENDING' | 'UNDER_REVIEW' | 'OVERRIDDEN' | 'REJECTED'
  page?: number
  limit?: number
} = {}) {
  const where = status ? { status } : {}
  const skip = (page - 1) * limit

  const [disputes, total] = await Promise.all([
    db.resolutionDispute.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        flaggedBy: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        reviewedBy: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        market: {
          select: {
            id: true,
            question: true,
            slug: true,
            resolvedAt: true,
            marketResolution: {
              select: {
                id: true,
                resolutionId: true,
                supportingLink: true,
                resolution: { select: { id: true, name: true, color: true } },
                resolvedBy: { select: { id: true, username: true, displayName: true } },
              },
            },
          },
        },
      },
    }),
    db.resolutionDispute.count({ where }),
  ])

  return {
    disputes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getMarketResolutionDisputes({ marketId }: { marketId: string }) {
  return db.resolutionDispute.findMany({
    where: { marketId },
    orderBy: { createdAt: 'desc' },
    include: {
      flaggedBy: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  })
}
