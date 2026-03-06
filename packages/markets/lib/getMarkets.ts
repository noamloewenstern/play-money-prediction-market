import { getPaginatedItems, PaginationRequest } from '@play-money/api-helpers'
import db, { Market } from '@play-money/database'
import { isAdmin } from '@play-money/users/rules'
import { ExtendedMarket } from '../types'

type MarketFilterOptions = {
  status?: 'active' | 'halted' | 'closed' | 'resolved' | 'canceled' | 'all'
  createdBy?: string
  tags?: Array<string>
  marketType?: 'binary' | 'multi'
  minTraders?: number
  maxTraders?: number
  minLiquidity?: number
  maxLiquidity?: number
  closeDateMin?: Date
  closeDateMax?: Date
  featured?: boolean
  requestingUserId?: string
  parentMarketId?: string
}

function getStatusFilters(status: MarketFilterOptions['status']) {
  switch (status) {
    case 'active':
      return {
        closeDate: { gt: new Date() },
        resolvedAt: null,
        canceledAt: null,
      }
    case 'closed':
      return {
        closeDate: { lt: new Date() },
        resolvedAt: null,
        canceledAt: null,
      }
    case 'resolved':
      return {
        resolvedAt: { not: null },
      }
    case 'canceled':
      return {
        canceledAt: { not: null },
      }
    default:
      return {}
  }
}

export async function getMarkets(filters: MarketFilterOptions = {}, pagination?: PaginationRequest) {
  const statusFilters = getStatusFilters(filters.status)

  const closeDateFilter: Record<string, Date> = {}
  if (statusFilters.closeDate) {
    Object.assign(closeDateFilter, statusFilters.closeDate)
  }
  if (filters.closeDateMin) closeDateFilter.gte = filters.closeDateMin
  if (filters.closeDateMax) closeDateFilter.lte = filters.closeDateMax

  const liquidityFilter: Record<string, number> = {}
  if (filters.minLiquidity != null) liquidityFilter.gte = filters.minLiquidity
  if (filters.maxLiquidity != null) liquidityFilter.lte = filters.maxLiquidity

  const tradersFilter: Record<string, number> = {}
  if (filters.minTraders != null) tradersFilter.gte = filters.minTraders
  if (filters.maxTraders != null) tradersFilter.lte = filters.maxTraders

  // Determine visibility filter: admins see all, authenticated users see public + their own private, others see only public
  let visibilityFilter: Record<string, unknown> | undefined
  if (filters.requestingUserId) {
    const requestingUser = await db.user.findUnique({ where: { id: filters.requestingUserId } })
    if (!requestingUser || !isAdmin({ user: requestingUser })) {
      // Non-admin: show public markets OR markets created by this user
      visibilityFilter = {
        OR: [
          { visibility: 'PUBLIC' },
          { createdBy: filters.requestingUserId },
        ],
      }
    }
    // Admins: no visibility filter (see everything)
  } else {
    // Unauthenticated: only public markets
    visibilityFilter = { visibility: 'PUBLIC' }
  }

  const results = await getPaginatedItems<Market | ExtendedMarket>({
    model: db.market,
    pagination: pagination ?? {},
    where: {
      ...statusFilters,
      ...(Object.keys(closeDateFilter).length > 0 ? { closeDate: closeDateFilter } : {}),
      createdBy: filters.createdBy,
      tags: filters.tags ? { hasSome: filters.tags } : undefined,
      // When filtering by parentMarketId, show those conditional markets; otherwise exclude list-scoped markets
      ...(filters.parentMarketId !== undefined
        ? { parentMarketId: filters.parentMarketId }
        : { parentListId: null }),
      ...(Object.keys(liquidityFilter).length > 0 ? { liquidityCount: liquidityFilter } : {}),
      ...(Object.keys(tradersFilter).length > 0 ? { uniqueTradersCount: tradersFilter } : {}),
      ...(filters.featured !== undefined ? { isFeatured: filters.featured } : {}),
      ...visibilityFilter,
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

  if (filters.marketType) {
    const filtered = results.data.filter((market) => {
      const optionCount = (market as ExtendedMarket).options?.length ?? 0
      return filters.marketType === 'binary' ? optionCount === 2 : optionCount > 2
    })
    return { ...results, data: filtered }
  }

  return results
}
