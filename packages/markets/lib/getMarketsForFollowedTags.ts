import { getPaginatedItems, PaginationRequest } from '@play-money/api-helpers'
import db, { Market } from '@play-money/database'
import { ExtendedMarket } from '../types'
import { getFollowedTags } from './getFollowedTags'

export async function getMarketsForFollowedTags(
  { userId }: { userId: string },
  pagination?: PaginationRequest
) {
  const followedTags = await getFollowedTags({ userId })

  if (!followedTags.length) {
    return { data: [], pageInfo: { hasMore: false } }
  }

  return getPaginatedItems<Market | ExtendedMarket>({
    model: db.market,
    pagination: pagination ?? {},
    where: {
      tags: { hasSome: followedTags },
      closeDate: { gt: new Date() },
      resolvedAt: null,
      canceledAt: null,
      parentListId: null,
    },
    include: {
      user: true,
      options: true,
      marketResolution: {
        include: {
          resolution: true,
          resolvedBy: true,
        },
      },
      parentList: true,
    },
  })
}
