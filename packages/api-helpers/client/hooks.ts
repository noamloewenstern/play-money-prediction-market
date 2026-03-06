import useSWR from 'swr'
import { User } from '@play-money/database'
import { MarketOptionPositionAsNumbers, NetBalanceAsNumbers } from '@play-money/finance/lib/getBalances'
import { TransactionWithEntries } from '@play-money/finance/types'
import { ExtendedMarket, MarketActivity } from '@play-money/markets/types'
import { NotificationGroupWithLastNotification } from '@play-money/notifications/lib/getNotifications'
import { Quest } from '@play-money/quests/components/QuestCard'

// TODO: @casesandberg Generate this from OpenAPI schema

const SIXTY_SECONDS = 1000 * 60
const FIVE_MINUTES = SIXTY_SECONDS * 5
const ONE_HOUR = SIXTY_SECONDS * 60

export function useRecentTrades() {
  return useSWR<{ data: Array<TransactionWithEntries> }>(`/v1/transactions?transactionType=TRADE_BUY,TRADE_SELL`, {
    refreshInterval: FIVE_MINUTES,
  })
}

export function useSiteActivity() {
  return useSWR<{ data: Array<MarketActivity> }>(`/v1/activity`, { refreshInterval: FIVE_MINUTES })
}

export function MARKET_BALANCE_PATH(marketId: string) {
  return `/v1/markets/${marketId}/balance`
}
export function useMarketBalance({ marketId }: { marketId: string }) {
  return useSWR<{
    data: {
      amm: Array<NetBalanceAsNumbers>
      user: Array<NetBalanceAsNumbers>
      userPositions: Array<MarketOptionPositionAsNumbers>
    }
  }>(MARKET_BALANCE_PATH(marketId), {
    refreshInterval: SIXTY_SECONDS,
  })
}

export function LIST_BALANCE_PATH(listId: string) {
  return `/v1/lists/${listId}/balance`
}
export function useListBalance({ listId }: { listId: string }) {
  return useSWR<{
    data: {
      user: Array<NetBalanceAsNumbers>
      userPositions: Array<MarketOptionPositionAsNumbers>
    }
  }>(LIST_BALANCE_PATH(listId), {
    refreshInterval: SIXTY_SECONDS,
  })
}

export function useMarketBalances({ marketId }: { marketId: string }) {
  return useSWR<{
    data: {
      balances: Array<NetBalanceAsNumbers & { account: { userPrimary: User } }>
      user: NetBalanceAsNumbers & { account: { userPrimary: User } }
    }
  }>(`/v1/markets/${marketId}/balances`)
}

export function MARKET_GRAPH_PATH(marketId: string) {
  return `/v1/markets/${marketId}/graph`
}
export function useMarketGraph({ marketId }: { marketId: string }) {
  return useSWR<{
    data: Array<{
      startAt: Date
      endAt: Date
      options: Array<{
        id: string
        probability: number
      }>
    }>
  }>(MARKET_GRAPH_PATH(marketId), { refreshInterval: FIVE_MINUTES })
}

export function LIST_GRAPH_PATH(listId: string) {
  return `/v1/lists/${listId}/graph`
}
export function useListGraph({ listId }: { listId: string }) {
  return useSWR<{
    data: Array<{
      startAt: Date
      endAt: Date
      markets: Array<{
        id: string
        probability: number
      }>
    }>
  }>(LIST_GRAPH_PATH(listId), { refreshInterval: FIVE_MINUTES })
}

export function useMarketRelated({ marketId }: { marketId: string }) {
  return useSWR<{
    data: Array<ExtendedMarket>
  }>(`/v1/markets/${marketId}/related`)
}

export const MY_NOTIFICATIONS_PATH = '/v1/users/me/notifications'
export function useNotifications({ skip = false }: { skip?: boolean }) {
  return useSWR<{ data: { unreadCount: number; notifications: Array<NotificationGroupWithLastNotification> } }>(
    !skip ? MY_NOTIFICATIONS_PATH : null,
    { refreshInterval: FIVE_MINUTES, refreshWhenHidden: false }
  )
}

const THIRTY_SECONDS = 1000 * 30
export const MY_UNREAD_COUNT_PATH = '/v1/users/me/notifications/unread-count'
export function useUnreadNotificationCount({ skip = false }: { skip?: boolean }) {
  return useSWR<{ data: { count: number } }>(
    !skip ? MY_UNREAD_COUNT_PATH : null,
    { refreshInterval: THIRTY_SECONDS, refreshWhenHidden: false }
  )
}

export const MY_QUIET_HOURS_PATH = '/v1/users/me/quiet-hours'
export function useMyQuietHours({ skip = false }: { skip?: boolean } = {}) {
  return useSWR<{
    data: {
      quietHoursEnabled: boolean
      quietHoursStart: number | null
      quietHoursEnd: number | null
      doNotDisturb: boolean
      timezone: string
    }
  }>(!skip ? MY_QUIET_HOURS_PATH : null)
}

export function useUserStats({ userId, skip = false }: { userId: string; skip?: boolean }) {
  return useSWR<{
    data: {
      quests: Array<Quest>
      milestones: {
        hasTraded: boolean
        hasCreatedMarket: boolean
        hasCommented: boolean
        hasBoostedLiquidity: boolean
      }
    }
  }>(!skip ? `/v1/users/${userId}/stats` : null)
}

export function useCreatorReputation({ userId, skip = false }: { userId: string; skip?: boolean }) {
  return useSWR<{
    data: {
      score: number
      totalMarkets: number
      resolvedMarkets: number
      canceledMarkets: number
      breakdown: {
        resolutionRate: number
        timeliness: number
        traderAttraction: number
        volumeGenerated: number
        communityEngagement: number
      }
    }
  }>(!skip ? `/v1/users/${userId}/reputation` : null)
}

export const MY_BALANCE_PATH = '/v1/users/me/balance'
export function useMyBalance({ skip = false }: { skip?: boolean }) {
  return useSWR<{ data: { balance: number } }>(!skip ? '/v1/users/me/balance' : null, {
    refreshWhenHidden: false,
  })
}

export function useUserGraph({ userId }: { userId: string }) {
  return useSWR<{
    data: Array<{
      balance: number
      liquidity: number
      markets: number
      startAt: Date
      endAt: Date
    }>
  }>(`/v1/users/${userId}/graph`, { refreshInterval: FIVE_MINUTES })
}

export function useTransparencyStatsUsers() {
  return useSWR<{
    data: Array<{
      dau: number
      signups: number
      referrals: number
      startAt: Date
      endAt: Date
    }>
  }>(`/v1/transparency/stats/users`, { refreshInterval: ONE_HOUR })
}

export function useAdminAuditLogs({
  action,
  actorId,
  targetType,
  targetId,
  cursor,
  limit,
}: {
  action?: string
  actorId?: string
  targetType?: string
  targetId?: string
  cursor?: string
  limit?: number
} = {}) {
  const params = new URLSearchParams(
    JSON.parse(JSON.stringify({ action, actorId, targetType, targetId, cursor, limit }))
  )
  const qs = params.toString()
  return useSWR<{
    data: Array<{
      id: string
      action: string
      actorId: string
      actor: { id: string; username: string; displayName: string; avatarUrl: string | null }
      targetType: string
      targetId: string
      before: unknown
      after: unknown
      metadata: unknown
      createdAt: string
    }>
    pageInfo: { hasNextPage: boolean; endCursor?: string; total: number }
  }>(`/v1/admin/audit-logs${qs ? `?${qs}` : ''}`, { refreshInterval: SIXTY_SECONDS })
}

export const TAG_FOLLOW_PATH = (tag: string) => `/v1/tags/${encodeURIComponent(tag)}/follow`
export function useTagFollow({ tag, skip = false }: { tag: string; skip?: boolean }) {
  return useSWR<{ data: { isFollowing: boolean } }>(!skip ? TAG_FOLLOW_PATH(tag) : null)
}

export const MY_FOLLOWED_TAGS_PATH = '/v1/users/me/followed-tags'
export function useMyFollowedTags({ skip = false }: { skip?: boolean } = {}) {
  return useSWR<{ data: Array<string> }>(!skip ? MY_FOLLOWED_TAGS_PATH : null)
}

export const MARKET_BOOKMARK_PATH = (marketId: string) => `/v1/markets/${encodeURIComponent(marketId)}/bookmark`
export function useMarketBookmark({ marketId, skip = false }: { marketId: string; skip?: boolean }) {
  return useSWR<{ data: { isBookmarked: boolean } }>(!skip ? MARKET_BOOKMARK_PATH(marketId) : null)
}

export const MY_BOOKMARKS_PATH = '/v1/users/me/bookmarks'
export function useMyBookmarks({ skip = false }: { skip?: boolean } = {}) {
  return useSWR<{ data: Array<{ id: string; marketId: string; createdAt: string; market: ExtendedMarket }> }>(
    !skip ? MY_BOOKMARKS_PATH : null
  )
}

export const MY_WEBHOOKS_PATH = '/v1/webhooks'
export function useMyWebhooks({ skip = false }: { skip?: boolean } = {}) {
  return useSWR<{
    data: Array<{
      id: string
      url: string
      events: Array<string>
      isActive: boolean
      createdAt: string
      updatedAt: string
    }>
  }>(!skip ? MY_WEBHOOKS_PATH : null)
}
