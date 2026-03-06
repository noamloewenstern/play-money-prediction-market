import { CommentWithReactions } from '@play-money/comments/lib/getComment'
import { ApiKey, CommentEntityType, List, Market, MarketOption, MarketOptionPosition, User } from '@play-money/database'
import { NetBalanceAsNumbers } from '@play-money/finance/lib/getBalances'
import { TransactionWithEntries, LeaderboardUser, ExtendedMarketOptionPosition } from '@play-money/finance/types'
import { ExtendedList } from '@play-money/lists/types'
import { ExtendedMarket, ExtendedMarketPosition, MarketActivity } from '@play-money/markets/types'
import { PaginatedResponse, PaginationRequest } from '../types'

// TODO: @casesandberg Generate this from OpenAPI schema

export class ApiError extends Error {
  code?: string
  statusCode: number

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

async function apiHandler<T>(
  input: string,
  options?: { method?: string; body?: Record<string, unknown>; next?: unknown }
) {
  const creds: Record<string, unknown> = {}
  let url = input

  try {
    // In server component
    const { cookies } = require('next/headers')
    creds.headers = { Cookie: cookies().toString() }
    // When running in Docker, server-side requests need to reach the API via internal hostname
    const internalApiUrl = process.env.INTERNAL_API_URL
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL
    if (internalApiUrl && publicApiUrl && url.startsWith(publicApiUrl)) {
      url = url.replace(publicApiUrl, internalApiUrl)
    }
  } catch (error) {
    // In client component
    creds.credentials = 'include'
  }
  const headers = {
    ...((creds.headers as Record<string, string>) || {}),
    ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
  }
  const res = await fetch(url, {
    method: options?.method,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    next: options?.next,
    ...creds,
    headers,
  } as RequestInit)

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    const body = (await res.json()) as { error: string; code?: string }
    throw new ApiError(body.error || 'There was an error with this request', res.status, body.code)
  }

  return res.json() as Promise<T>
}

export async function getMarketTransactions({
  marketId,
  ...paginationParams
}: {
  marketId: string
} & PaginationRequest) {
  const currentParams = new URLSearchParams(
    JSON.parse(
      JSON.stringify({
        marketId,
        transactionType: ['TRADE_BUY', 'TRADE_SELL'],
        ...paginationParams,
      })
    )
  )

  const search = currentParams.toString()

  return apiHandler<PaginatedResponse<TransactionWithEntries>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/transactions${search ? `?${search}` : ''}`
  )
}

export async function getMarketLiquidityTransactions({
  marketId,
  ...paginationParams
}: {
  marketId: string
} & PaginationRequest) {
  const currentParams = new URLSearchParams(
    JSON.parse(
      JSON.stringify({
        marketId,
        transactionType: ['LIQUIDITY_INITIALIZE', 'LIQUIDITY_DEPOSIT', 'LIQUIDITY_WITHDRAWAL'],
        ...paginationParams,
      })
    )
  )

  const search = currentParams.toString()

  return apiHandler<PaginatedResponse<TransactionWithEntries>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/transactions${search ? `?${search}` : ''}`
  )
}

export async function createCommentReaction({ commentId, emoji }: { commentId: string; emoji: string }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/comments/${commentId}/reaction`, {
    method: 'POST',
    body: {
      emoji,
      commentId,
    },
  })
}

export type PollInput = {
  question: string
  options: Array<string>
  closesAt?: string | null
}

export async function createComment({
  content,
  parentId,
  entity,
  poll,
}: {
  content: string
  parentId?: string
  entity: { type: CommentEntityType; id: string }
  poll?: PollInput
}) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/comments`, {
    method: 'POST',
    body: {
      content,
      parentId: parentId ?? null,
      entityType: entity.type,
      entityId: entity.id,
      poll: poll ?? undefined,
    },
  })
}

export async function voteOnCommentPoll({ commentId, pollId, optionId }: { commentId: string; pollId: string; optionId: string }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/comments/${commentId}/poll/vote`, {
    method: 'POST',
    body: { pollId, optionId },
  })
}

export async function updateComment({ commentId, content }: { commentId: string; content: string }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/comments/${commentId}`, {
    method: 'PATCH',
    body: {
      content,
    },
  })
}

export async function deleteComment({ commentId }: { commentId: string }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/comments/${commentId}`, {
    method: 'DELETE',
  })
}

export async function pinComment({ commentId }: { commentId: string }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/comments/${commentId}/pin`, {
    method: 'POST',
  })
}

export async function unpinComment({ commentId }: { commentId: string }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/comments/${commentId}/pin`, {
    method: 'DELETE',
  })
}

export type CommentEditHistoryEntry = {
  id: string
  content: string
  editedAt: string
  editedBy: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export async function getCommentHistory({ commentId }: { commentId: string }) {
  return apiHandler<{ data: Array<CommentEditHistoryEntry> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/comments/${commentId}/history`
  )
}

export async function getMyBalance() {
  return apiHandler<{ data: { balance: number } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/balance`)
}

export async function getMyReferrals() {
  return apiHandler<{ data: Array<User> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/referrals`)
}

export async function getMarkets({
  status,
  createdBy,
  tags,
  marketType,
  minTraders,
  maxTraders,
  minLiquidity,
  maxLiquidity,
  closeDateMin,
  closeDateMax,
  featured,
  ...paginationParams
}: {
  status?: string
  createdBy?: string
  tags?: Array<string>
  marketType?: string
  minTraders?: number
  maxTraders?: number
  minLiquidity?: number
  maxLiquidity?: number
  closeDateMin?: string
  closeDateMax?: string
  featured?: boolean
} & PaginationRequest = {}) {
  const currentParams = new URLSearchParams(
    JSON.parse(
      JSON.stringify({
        status,
        createdBy,
        tags,
        marketType,
        minTraders,
        maxTraders,
        minLiquidity,
        maxLiquidity,
        closeDateMin,
        closeDateMax,
        featured,
        ...paginationParams,
      })
    )
  )

  const search = currentParams.toString()

  return apiHandler<PaginatedResponse<ExtendedMarket>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets${search ? `?${search}` : ''}`,
    {
      next: { tags: ['markets'] },
    }
  )
}

export async function getConditionalMarkets({ parentMarketId }: { parentMarketId: string }) {
  const search = new URLSearchParams(
    JSON.parse(JSON.stringify({ parentMarketId, status: 'all' }))
  ).toString()
  return apiHandler<PaginatedResponse<ExtendedMarket>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets${search ? `?${search}` : ''}`,
    {
      next: { tags: [`${parentMarketId}:conditional-markets`] },
    }
  )
}

export async function getMarketPositions({
  ownerId,
  marketId,
  status,
  ...paginationParams
}: {
  ownerId?: string
  marketId?: string
  status?: 'active' | 'closed' | 'all'
} & PaginationRequest = {}): Promise<PaginatedResponse<ExtendedMarketPosition>> {
  const currentParams = new URLSearchParams(
    JSON.parse(
      JSON.stringify({
        ownerId,
        status,
        ...paginationParams,
      })
    )
  )
  const search = currentParams.toString()

  return apiHandler<PaginatedResponse<ExtendedMarketPosition>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/positions${search ? `?${search}` : ''}`,
    {
      next: { tags: ['markets'] },
    }
  )
}

export async function getLists({
  ownerId,
  ...paginationParams
}: {
  ownerId?: string
} & PaginationRequest = {}): Promise<PaginatedResponse<ExtendedList>> {
  const currentParams = new URLSearchParams(JSON.parse(JSON.stringify({ ownerId, ...paginationParams })))
  const search = currentParams.toString()

  return apiHandler<PaginatedResponse<ExtendedList>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/lists${search ? `?${search}` : ''}`,
    {
      next: { tags: ['lists'] },
    }
  )
}

export async function getExtendedMarket({ marketId }: { marketId: string }) {
  return apiHandler<{ data: ExtendedMarket }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}?extended=true`,
    {
      next: { tags: [`market:${marketId}`] },
    }
  )
}

export async function getExtendedList({ listId }: { listId: string }) {
  return apiHandler<{ data: ExtendedList }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}?extended=true`, {
    next: { tags: [`list:${listId}`] },
  })
}

export async function createMarket(body: Record<string, unknown>) {
  return apiHandler<{ data: { market?: Market; list?: List } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets`, {
    method: 'POST',
    body,
  })
}

export async function createListMarket({ listId }: { listId: string }, body: Record<string, unknown>) {
  return apiHandler<{ data: { market?: Market; list?: List } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}/markets`,
    {
      method: 'POST',
      body,
    }
  )
}

export async function updateMarket({ marketId, body }: { marketId: string; body: Record<string, unknown> }) {
  return apiHandler<{ data: Market }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}`, {
    method: 'PATCH',
    body: body,
  })
}

export async function updateList({ listId, body }: { listId: string; body: Record<string, unknown> }) {
  return apiHandler<{ data: Market }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}`, {
    method: 'PATCH',
    body: body,
  })
}

export async function updateMarketOption({
  marketId,
  optionId,
  body,
}: {
  marketId: string
  optionId: string
  body: Record<string, unknown>
}) {
  return apiHandler<{ data: Market }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/options/${optionId}`, {
    method: 'PATCH',
    body: body,
  })
}

export async function createLiquidity({ marketId, amount }: { marketId: string; amount: number }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/liquidity`, {
    method: 'POST',
    body: {
      amount,
    },
  })
}

export async function createMarketBuy({
  marketId,
  optionId,
  amount,
  note,
}: {
  marketId: string
  optionId: string
  amount: number
  note?: string
}) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/buy`, {
    method: 'POST',
    body: JSON.parse(JSON.stringify({ optionId, amount, note })),
  })
}

export async function createMarketSell({
  marketId,
  optionId,
  amount,
  note,
}: {
  marketId: string
  optionId: string
  amount: number
  note?: string
}) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/sell`, {
    method: 'POST',
    body: JSON.parse(JSON.stringify({ optionId, amount, note })),
  })
}

export async function getMarketQuote({
  marketId,
  optionId,
  amount,
  isBuy = true,
}: {
  marketId: string
  optionId: string
  amount: number
  isBuy?: boolean
}) {
  return apiHandler<{ data: { newProbability: number; potentialReturn: number } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/quote`,
    {
      method: 'POST',
      body: {
        optionId,
        amount,
        isBuy,
      },
    }
  )
}

export async function getMarketComments({
  marketId,
}: {
  marketId: string
}): Promise<{ data: Array<CommentWithReactions> }> {
  return apiHandler<{ data: Array<CommentWithReactions> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/comments`,
    {
      next: { tags: [`${marketId}:comments`] },
    }
  )
}

export async function getMarketActivity({ marketId }: { marketId: string }): Promise<{ data: Array<MarketActivity> }> {
  return apiHandler<{ data: Array<MarketActivity> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/activity`,
    {
      next: { tags: [`${marketId}:activity`] },
    }
  )
}

export async function getListComments({ listId }: { listId: string }): Promise<{ data: Array<CommentWithReactions> }> {
  return apiHandler<{ data: Array<CommentWithReactions> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}/comments`,
    {
      next: { tags: [`list:${listId}:comments`] },
    }
  )
}

export async function createMarketResolve({
  marketId,
  optionId,
  supportingLink,
}: {
  marketId: string
  optionId: string
  supportingLink?: string
}) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/resolve`, {
    method: 'POST',
    body: {
      optionId,
      supportingLink,
    },
  })
}

export async function createNumericMarketResolve({
  marketId,
  numericValue,
  supportingLink,
}: {
  marketId: string
  numericValue: number
  supportingLink?: string
}) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/resolve-numeric`, {
    method: 'POST',
    body: {
      numericValue,
      supportingLink,
    },
  })
}

export async function createMarketCancel({ marketId, reason }: { marketId: string; reason: string }) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/cancel`, {
    method: 'POST',
    body: {
      reason,
    },
  })
}

// Quiet Hours

export type QuietHoursSettings = {
  quietHoursEnabled: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
  doNotDisturb: boolean
  timezone: string
}

export async function getMyQuietHours(): Promise<{ data: QuietHoursSettings }> {
  return apiHandler<{ data: QuietHoursSettings }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/quiet-hours`)
}

export async function updateMyQuietHours(body: {
  quietHoursEnabled?: boolean
  quietHoursStart?: number | null
  quietHoursEnd?: number | null
  doNotDisturb?: boolean
}): Promise<{ data: QuietHoursSettings }> {
  return apiHandler<{ data: QuietHoursSettings }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/quiet-hours`, {
    method: 'PATCH',
    body,
  })
}

export async function createMyNotifications(options?: {
  type?: string
  groupId?: string
  undo?: boolean
  markedAt?: string
}) {
  return apiHandler<{ data: { success: boolean; count?: number; markedAt?: string } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/notifications`,
    {
      method: 'POST',
      ...(options ? { body: options as Record<string, unknown> } : {}),
    }
  )
}

export async function createMyResourceViewed({
  resourceType,
  resourceId,
}: {
  resourceType: string
  resourceId: string
}) {
  return apiHandler<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/resource-viewed`, {
    method: 'POST',
    body: {
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
    },
  })
}

export type CommentSearchResult = {
  id: string
  content: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  entityType: string
  entityId: string
  entityTitle: string
  entitySlug: string
  createdAt: string
}

export async function getSearch({ query }: { query: string }) {
  return apiHandler<{
    data: {
      users: Array<User>
      markets: Array<Market>
      lists: Array<List>
      tags: Array<{ tag: string; count: number }>
      comments: Array<CommentSearchResult>
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/search?query=${encodeURIComponent(query)}`)
}

export async function getUserCheckUsername({
  username,
}: {
  username: string
}): Promise<{ data: { available: boolean; message?: string } }> {
  return apiHandler<{ data: { available: boolean; message?: string } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/check-username?username=${encodeURIComponent(username)}`
  )
}

export async function updateMe(data: Record<string, unknown>) {
  return apiHandler<{ data: User }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me`, {
    method: 'PATCH',
    body: data,
  })
}

export async function getUserStats({ userId }: { userId: string }) {
  return apiHandler<{
    data: {
      netWorth: number
      tradingVolume: number
      totalMarkets: number
      lastTradeAt: Date
      activeDayCount: number
      otherIncome: number
      quests: Array<{
        title: string
        award: number
        completed: boolean
        href: string
      }>
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/stats`)
}

export async function getUserPortfolioExposure({ userId }: { userId: string }) {
  return apiHandler<{
    data: {
      totalValue: number
      totalCost: number
      totalPnl: number
      maxLoss: number
      tagExposures: Array<{
        tag: string
        totalValue: number
        totalCost: number
        pnl: number
        pnlPercent: number
        positionCount: number
        positions: Array<{
          marketId: string
          marketQuestion: string
          optionName: string
          optionColor: string
          value: number
          cost: number
          quantity: number
          pnl: number
          pnlPercent: number
        }>
      }>
      correlatedGroups: Array<{
        tags: Array<string>
        totalValue: number
        positionCount: number
        marketIds: Array<string>
      }>
      untaggedExposure: {
        tag: string
        totalValue: number
        totalCost: number
        pnl: number
        pnlPercent: number
        positionCount: number
        positions: Array<{
          marketId: string
          marketQuestion: string
          optionName: string
          optionColor: string
          value: number
          cost: number
          quantity: number
          pnl: number
          pnlPercent: number
        }>
      } | null
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/portfolio-exposure`)
}

type PortfolioAnalyticsMarketResult = {
  marketId: string
  marketQuestion: string
  marketSlug: string
  pnl: number
  amountInvested: number
  returnPercent: number
  isWin: boolean
  resolvedAt: string | null
}

type PortfolioAnalyticsCategoryPnl = {
  tag: string
  realizedPnl: number
  unrealizedPnl: number
  totalPnl: number
  tradingVolume: number
  marketCount: number
}

export type PortfolioAnalytics = {
  summary: {
    totalRealizedPnl: number
    totalUnrealizedPnl: number
    totalPnl: number
    winRate: number
    avgReturn: number
    marketsTraded: number
    marketsResolved: number
  }
  categoryBreakdown: Array<PortfolioAnalyticsCategoryPnl>
  largestWins: Array<PortfolioAnalyticsMarketResult>
  largestLosses: Array<PortfolioAnalyticsMarketResult>
  recentResults: Array<PortfolioAnalyticsMarketResult>
  platformComparison: {
    userWinRate: number
    platformAvgWinRate: number
    userAvgReturn: number
    platformAvgReturn: number
    userTradingVolume: number
    platformAvgTradingVolume: number
  }
}

export async function getUserPortfolioAnalytics({ userId }: { userId: string }) {
  return apiHandler<{ data: PortfolioAnalytics }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/analytics`)
}

export async function getCreatorReputation({ userId }: { userId: string }) {
  return apiHandler<{
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
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/reputation`)
}

export async function getUser({ userId }: { userId: string }): Promise<{ data: User }> {
  return apiHandler<{ data: User }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}`)
}

export async function getUserReferral({ code }: { code: string }): Promise<{ data: User }> {
  return apiHandler<{ data: User }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/referral/${code}`)
}

export async function getUserUsername({ username }: { username: string }): Promise<{ data: User }> {
  return apiHandler<{ data: User }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/username/${username}`, {
    next: {
      revalidate: 0, // Equivalent to `cache: 'no-store'` in Next.js for disabling caching
    },
  })
}

export async function getUserTransactions({ userId }: { userId: string }) {
  return apiHandler<PaginatedResponse<TransactionWithEntries>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/transactions`
  )
}

export async function getUserPositions({
  userId,
  status,
  ...paginationParams
}: {
  userId: string
  status?: 'active' | 'closed' | 'all'
} & PaginationRequest): Promise<PaginatedResponse<ExtendedMarketOptionPosition>> {
  const currentParams = new URLSearchParams(
    JSON.parse(
      JSON.stringify({
        status,
        ...paginationParams,
      })
    )
  )
  const search = currentParams.toString()

  return apiHandler<PaginatedResponse<ExtendedMarketOptionPosition>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/positions${search ? `?${search}` : ''}`
  )
}

export async function getUserBalance({
  userId,
}: {
  userId: string
}): Promise<{ data: { balance: NetBalanceAsNumbers } }> {
  return apiHandler<{ data: { balance: NetBalanceAsNumbers } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/balance`
  )
}

export async function getUserMarkets({ userId }: { userId: string }): Promise<PaginatedResponse<ExtendedMarket>> {
  return apiHandler<PaginatedResponse<ExtendedMarket>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets?createdBy=${userId}`
  )
}

export async function createMarketGenerateTags({ question }: { question: string }) {
  return apiHandler<{ data: Array<string> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/generate-tags`, {
    method: 'POST',
    body: {
      question,
    },
  })
}

export async function getLeaderboard({ month, year }: { month?: string; year?: string }) {
  return apiHandler<{
    data: {
      topTraders: Array<LeaderboardUser>
      topCreators: Array<LeaderboardUser>
      topPromoters: Array<LeaderboardUser>
      topQuesters: Array<LeaderboardUser>
      topReferrers: Array<LeaderboardUser>
      userRankings?: {
        trader: LeaderboardUser
        creator: LeaderboardUser
        promoter: LeaderboardUser
        quester: LeaderboardUser
        referrer: LeaderboardUser
      }
      rankingThresholds: {
        traders: { top10: number; top20: number; top50: number }
        creators: { top10: number; top20: number; top50: number }
        promoters: { top10: number; top20: number; top50: number }
        questers: { top10: number; top20: number; top50: number }
        referrers: { top10: number; top20: number; top50: number }
      }
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/leaderboard${month && year ? `?year=${year}&month=${month}` : ''}`)
}

export async function createMyApiKey({ name }: { name: string }): Promise<{ data: ApiKey & { key: string } }> {
  return apiHandler<{ data: ApiKey & { key: string } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/api-keys`, {
    method: 'POST',
    body: {
      name,
    },
  })
}

export async function getMyApiKeys(): Promise<{ data: Array<ApiKey> }> {
  return apiHandler<{ data: Array<ApiKey> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/api-keys`)
}

export async function followTag({ tag }: { tag: string }) {
  return apiHandler<{ data: { success: boolean } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/tags/${encodeURIComponent(tag)}/follow`, {
    method: 'POST',
  })
}

export async function unfollowTag({ tag }: { tag: string }) {
  return apiHandler<{ data: { success: boolean } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/tags/${encodeURIComponent(tag)}/follow`, {
    method: 'DELETE',
  })
}

export async function getMyFollowedTags(): Promise<{ data: Array<string> }> {
  return apiHandler<{ data: Array<string> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/followed-tags`)
}

export async function getPopularTags({
  excludeTag,
  limit,
}: { excludeTag?: string; limit?: number } = {}): Promise<{ data: Array<{ tag: string; count: number }> }> {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ excludeTag, limit })))
  const qs = params.toString()
  return apiHandler<{ data: Array<{ tag: string; count: number }> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/tags/popular${qs ? `?${qs}` : ''}`
  )
}

export async function bookmarkMarket({ marketId }: { marketId: string }) {
  return apiHandler<{ data: { success: boolean } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${encodeURIComponent(marketId)}/bookmark`, {
    method: 'POST',
  })
}

export async function unbookmarkMarket({ marketId }: { marketId: string }) {
  return apiHandler<{ data: { success: boolean } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${encodeURIComponent(marketId)}/bookmark`, {
    method: 'DELETE',
  })
}

export async function getMyFeed(paginationParams: PaginationRequest = {}) {
  const currentParams = new URLSearchParams(JSON.parse(JSON.stringify(paginationParams)))
  const search = currentParams.toString()

  return apiHandler<PaginatedResponse<ExtendedMarket>>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/feed${search ? `?${search}` : ''}`
  )
}

// Admin API functions

export async function getAdminStats() {
  return apiHandler<{
    data: {
      users: { total: number; newToday: number; newThisWeek: number; newThisMonth: number }
      markets: { total: number; active: number; resolved: number; canceled: number }
      comments: { total: number; hidden: number }
      trades: { last24h: number }
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/stats`)
}

export async function getAdminUsers({ search, page, limit }: { search?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ search, page, limit })))
  const qs = params.toString()
  return apiHandler<{
    data: Array<{
      id: string
      username: string
      displayName: string
      email: string
      role: string
      avatarUrl: string | null
      suspendedAt: string | null
      createdAt: string
      updatedAt: string
      _count: { markets: number; transactions: number; comments: number }
    }>
    page: number
    limit: number
    total: number
    totalPages: number
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/users${qs ? `?${qs}` : ''}`)
}

export async function updateAdminUser({
  userId,
  body,
}: {
  userId: string
  body: {
    role?: string
    grantAmount?: number
    balanceAdjustment?: number
    balanceReason?: string
    suspended?: boolean
    suspendReason?: string
  }
}) {
  return apiHandler<{ data: User }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/users/${userId}`, {
    method: 'PATCH',
    body,
  })
}

export async function getAdminMarkets({
  search,
  status,
  page,
  limit,
}: { search?: string; status?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ search, status, page, limit })))
  const qs = params.toString()
  return apiHandler<{
    data: Array<{
      id: string
      question: string
      slug: string
      closeDate: string | null
      resolvedAt: string | null
      canceledAt: string | null
      createdBy: string
      commentCount: number | null
      uniqueTradersCount: number | null
      liquidityCount: number | null
      createdAt: string
      updatedAt: string
      isFeatured: boolean
      featuredAt: string | null
      options: Array<{ id: string; name: string; color: string }>
      user: { id: string; username: string; displayName: string }
    }>
    page: number
    limit: number
    total: number
    totalPages: number
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/markets${qs ? `?${qs}` : ''}`)
}

export async function adminToggleMarketFeatured({ marketId }: { marketId: string }) {
  return apiHandler<{ data: { id: string; isFeatured: boolean; featuredAt: string | null } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/markets/${marketId}/featured`,
    { method: 'POST' }
  )
}

export async function getAdminComments({
  search,
  hidden,
  page,
  limit,
}: { search?: string; hidden?: boolean; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ search, hidden, page, limit })))
  const qs = params.toString()
  return apiHandler<{
    data: Array<{
      id: string
      content: string
      hidden: boolean
      entityType: string
      entityId: string
      createdAt: string
      updatedAt: string | null
      author: { id: string; username: string; displayName: string }
    }>
    page: number
    limit: number
    total: number
    totalPages: number
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/comments${qs ? `?${qs}` : ''}`)
}

export async function updateAdminComment({ commentId, body }: { commentId: string; body: { hidden?: boolean } }) {
  return apiHandler<{ data: unknown }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/comments/${commentId}`, {
    method: 'PATCH',
    body,
  })
}

export async function getAdminUserDetail({ userId }: { userId: string }) {
  return apiHandler<{
    data: {
      id: string
      username: string
      displayName: string
      avatarUrl: string | null
      email: string
      emailVerified: string | null
      role: string
      suspendedAt: string | null
      bio: string | null
      timezone: string
      twitterHandle: string | null
      discordHandle: string | null
      website: string | null
      referralCode: string | null
      referredBy: string | null
      primaryAccountId: string
      createdAt: string
      updatedAt: string
      _count: { markets: number; transactions: number; comments: number }
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/users/${userId}`)
}

export async function adminForceResolveMarket({
  marketId,
  optionId,
  supportingLink,
  reason,
}: {
  marketId: string
  optionId: string
  supportingLink?: string
  reason?: string
}) {
  return apiHandler<{ data: { success: boolean } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/markets/${marketId}/resolve`,
    { method: 'POST', body: { optionId, supportingLink, reason } }
  )
}

export type AdminBulkOperation =
  | { marketId: string; action: 'resolve'; optionId: string; supportingLink?: string; reason?: string }
  | { marketId: string; action: 'cancel'; reason: string }

export type AdminBulkResult = {
  marketId: string
  action: string
  success: boolean
  error?: string
}

export async function adminBulkResolveMarkets({ operations }: { operations: Array<AdminBulkOperation> }) {
  return apiHandler<{
    data: {
      results: Array<AdminBulkResult>
      summary: { total: number; succeeded: number; failed: number }
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/markets/bulk-resolve`, {
    method: 'POST',
    body: { operations },
  })
}

export async function adminImpersonateUser({ userId, reason }: { userId: string; reason?: string }) {
  return apiHandler<{
    data: {
      user: {
        id: string
        username: string
        displayName: string
        email: string
        role: string
        suspendedAt: string | null
        bio: string | null
        timezone: string
        twitterHandle: string | null
        discordHandle: string | null
        website: string | null
        referralCode: string | null
        primaryAccountId: string
        createdAt: string
      }
      impersonatedBy: { id: string; username: string }
      impersonatedAt: string
    }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/users/${userId}/impersonate`, {
    method: 'POST',
    body: { reason },
  })
}

export async function getAdminAuditLogs({
  action,
  cursor,
  limit,
}: { action?: string; cursor?: string; limit?: number } = {}) {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ action, cursor, limit })))
  const qs = params.toString()
  return apiHandler<{
    data: Array<{
      id: string
      action: string
      actorId: string
      targetType: string
      targetId: string
      before: unknown
      after: unknown
      metadata: unknown
      createdAt: string
      actor: { id: string; username: string; displayName: string; avatarUrl: string | null }
    }>
    pageInfo: { hasNextPage: boolean; endCursor?: string; total: number }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/audit-logs${qs ? `?${qs}` : ''}`)
}

// Webhooks

type WebhookResponse = {
  id: string
  url: string
  events: Array<string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function getMyWebhooks(): Promise<{ data: Array<WebhookResponse> }> {
  return apiHandler<{ data: Array<WebhookResponse> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/webhooks`)
}

export async function createMyWebhook({
  url,
  events,
}: {
  url: string
  events: Array<string>
}): Promise<{ data: WebhookResponse & { secret: string } }> {
  return apiHandler<{ data: WebhookResponse & { secret: string } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/webhooks`, {
    method: 'POST',
    body: { url, events },
  })
}

export async function updateMyWebhook({
  id,
  url,
  events,
  isActive,
}: {
  id: string
  url?: string
  events?: Array<string>
  isActive?: boolean
}): Promise<{ data: WebhookResponse }> {
  return apiHandler<{ data: WebhookResponse }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/webhooks/${id}`, {
    method: 'PATCH',
    body: JSON.parse(JSON.stringify({ url, events, isActive })),
  })
}

export async function deleteMyWebhook({ id }: { id: string }): Promise<void> {
  return apiHandler<void>(`${process.env.NEXT_PUBLIC_API_URL}/v1/webhooks/${id}`, {
    method: 'DELETE',
  })
}

export async function getWebhookDeliveries({
  webhookId,
  cursor,
  limit,
}: {
  webhookId: string
  cursor?: string
  limit?: number
}) {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ cursor, limit })))
  const qs = params.toString()
  return apiHandler<{
    data: Array<{
      id: string
      webhookId: string
      eventType: string
      payload: unknown
      status: string
      statusCode: number | null
      attempts: number
      lastError: string | null
      createdAt: string
    }>
    pageInfo: { hasNextPage: boolean; endCursor?: string }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/webhooks/${webhookId}/deliveries${qs ? `?${qs}` : ''}`)
}

// Evidence types

export type EvidenceType = 'FOR' | 'AGAINST' | 'NEUTRAL'

export type MarketEvidenceResponse = {
  id: string
  marketId: string
  authorId: string
  title: string
  content: string
  url: string | null
  evidenceType: EvidenceType
  upvoteCount: number
  downvoteCount: number
  userVote: boolean | null | undefined
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export async function getMarketEvidence({ marketId }: { marketId: string }): Promise<{ data: Array<MarketEvidenceResponse> }> {
  return apiHandler<{ data: Array<MarketEvidenceResponse> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/evidence`)
}

export async function createMarketEvidence({
  marketId,
  title,
  content,
  url,
  evidenceType,
}: {
  marketId: string
  title: string
  content: string
  url?: string
  evidenceType?: EvidenceType
}): Promise<{ data: MarketEvidenceResponse }> {
  return apiHandler<{ data: MarketEvidenceResponse }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/evidence`, {
    method: 'POST',
    body: JSON.parse(JSON.stringify({ title, content, url, evidenceType })),
  })
}

export async function voteOnMarketEvidence({
  marketId,
  evidenceId,
  isUpvote,
}: {
  marketId: string
  evidenceId: string
  isUpvote: boolean
}): Promise<{ data: { success: boolean } }> {
  return apiHandler<{ data: { success: boolean } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/evidence/${evidenceId}/votes`,
    { method: 'POST', body: { isUpvote } }
  )
}

export async function deleteMarketEvidence({
  marketId,
  evidenceId,
}: {
  marketId: string
  evidenceId: string
}): Promise<void> {
  return apiHandler<void>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/evidence/${evidenceId}`, {
    method: 'DELETE',
  })
}

// Trade Journal

export type TradeJournalEntry = {
  id: string
  userId: string
  marketId: string
  optionId: string
  transactionId: string
  tradeType: string
  note: string | null
  probabilityAtTrade: number | null
  createdAt: string
  updatedAt: string
  market: {
    id: string
    question: string
    slug: string
    resolvedAt: string | null
    canceledAt: string | null
    marketResolution: { resolutionId: string } | null
  }
  option: {
    id: string
    name: string
    color: string
  }
}

export async function getMyTradeJournal({
  limit,
  cursor,
}: { limit?: number; cursor?: string } = {}): Promise<{
  data: Array<TradeJournalEntry>
  pageInfo: { hasNextPage: boolean; endCursor: string | null; total: number }
}> {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ limit, cursor })))
  const qs = params.toString()
  return apiHandler<{
    data: Array<TradeJournalEntry>
    pageInfo: { hasNextPage: boolean; endCursor: string | null; total: number }
  }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/journal${qs ? `?${qs}` : ''}`)
}

export async function updateTradeJournalNote({
  id,
  note,
}: {
  id: string
  note: string
}): Promise<{ data: { success: boolean } }> {
  return apiHandler<{ data: { success: boolean } }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/journal/${id}`, {
    method: 'PATCH',
    body: { note },
  })
}

// Group/Tournament API

export type GroupMemberUser = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null | undefined
}

export type GroupMemberResponse = {
  id: string
  listId: string
  userId: string
  role: string
  createdAt: string
  user: GroupMemberUser
}

export async function getGroupMembers({ listId }: { listId: string }): Promise<{ data: Array<GroupMemberResponse> }> {
  return apiHandler<{ data: Array<GroupMemberResponse> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}/members`
  )
}

export async function addGroupMember({
  listId,
  userId,
  username,
  role,
}: {
  listId: string
  userId?: string
  username?: string
  role?: string
}): Promise<{ data: GroupMemberResponse }> {
  return apiHandler<{ data: GroupMemberResponse }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}/members`, {
    method: 'POST',
    body: { userId, username, role },
  })
}

export async function updateGroupMemberRole({
  listId,
  userId,
  role,
}: {
  listId: string
  userId: string
  role: string
}): Promise<{ data: GroupMemberResponse }> {
  return apiHandler<{ data: GroupMemberResponse }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}/members/${userId}`,
    {
      method: 'PATCH',
      body: { role },
    }
  )
}

export async function removeGroupMember({ listId, userId }: { listId: string; userId: string }): Promise<void> {
  return apiHandler<void>(`${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export async function getGroupLeaderboard({
  listId,
}: {
  listId: string
}): Promise<{ data: { traders: Array<LeaderboardUser> } }> {
  return apiHandler<{ data: { traders: Array<LeaderboardUser> } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/lists/${listId}/leaderboard`
  )
}

// Probability Alerts

export type AlertDirection = 'ABOVE' | 'BELOW'

export type ProbabilityAlertResponse = {
  id: string
  userId: string
  marketId: string
  optionId: string
  threshold: number
  direction: AlertDirection
  isActive: boolean
  triggeredAt: string | null
  createdAt: string
  updatedAt: string
  option: {
    id: string
    name: string
    color: string
    probability: number | null
  }
}

export async function getMarketAlerts({
  marketId,
}: {
  marketId: string
}): Promise<{ data: Array<ProbabilityAlertResponse> }> {
  return apiHandler<{ data: Array<ProbabilityAlertResponse> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/alerts`
  )
}

export async function createMarketAlert({
  marketId,
  optionId,
  threshold,
  direction,
}: {
  marketId: string
  optionId: string
  threshold: number
  direction: AlertDirection
}): Promise<{ data: ProbabilityAlertResponse }> {
  return apiHandler<{ data: ProbabilityAlertResponse }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/alerts`,
    { method: 'POST', body: { optionId, threshold, direction } }
  )
}

export async function deleteMarketAlert({
  marketId,
  alertId,
}: {
  marketId: string
  alertId: string
}): Promise<void> {
  return apiHandler<void>(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/alerts/${alertId}`, {
    method: 'DELETE',
  })
}

// Resolution Disputes

export type ResolutionDisputeStatus = 'PENDING' | 'UNDER_REVIEW' | 'OVERRIDDEN' | 'REJECTED'

export type ResolutionDisputeResponse = {
  id: string
  marketId: string
  marketResolutionId: string
  flaggedById: string
  reason: string
  status: ResolutionDisputeStatus
  reviewedById: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  flaggedBy: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  reviewedBy?: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  } | null
}

export async function getMarketResolutionDisputes({
  marketId,
}: {
  marketId: string
}): Promise<{ data: Array<ResolutionDisputeResponse> }> {
  return apiHandler<{ data: Array<ResolutionDisputeResponse> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/resolution-dispute`
  )
}

export async function flagMarketResolutionDispute({
  marketId,
  reason,
}: {
  marketId: string
  reason: string
}): Promise<{ data: ResolutionDisputeResponse }> {
  return apiHandler<{ data: ResolutionDisputeResponse }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/resolution-dispute`,
    { method: 'POST', body: { reason } }
  )
}

export async function getAdminResolutionDisputes({
  status,
  page,
  limit,
}: {
  status?: ResolutionDisputeStatus
  page?: number
  limit?: number
} = {}): Promise<{
  disputes: Array<ResolutionDisputeResponse & {
    market: {
      id: string
      question: string
      slug: string
      resolvedAt: string | null
      marketResolution: {
        id: string
        resolutionId: string
        supportingLink: string | null
        resolution: { id: string; name: string; color: string }
        resolvedBy: { id: string; username: string; displayName: string }
      } | null
    }
  }>
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const params = new URLSearchParams(JSON.parse(JSON.stringify({ status, page, limit })))
  const qs = params.toString()
  return apiHandler(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/markets/disputes${qs ? `?${qs}` : ''}`)
}

export async function adminReviewResolutionDispute({
  marketId,
  disputeId,
  action,
  reviewNote,
  newOptionId,
  newSupportingLink,
}: {
  marketId: string
  disputeId: string
  action: 'reject' | 'override'
  reviewNote?: string
  newOptionId?: string
  newSupportingLink?: string
}): Promise<{ data: { action: string; disputeId: string } }> {
  return apiHandler<{ data: { action: string; disputeId: string } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/admin/markets/${marketId}/disputes/${disputeId}`,
    {
      method: 'PATCH',
      body: JSON.parse(JSON.stringify({ action, reviewNote, newOptionId, newSupportingLink })),
    }
  )
}

export async function getTagLeaderboard({ tag }: { tag: string }): Promise<{
  data: {
    traders: Array<{
      userId: string
      displayName: string
      username: string
      avatarUrl?: string | null
      total: number
      rank: number
    }>
  }
}> {
  return apiHandler(`${process.env.NEXT_PUBLIC_API_URL}/v1/tags/${encodeURIComponent(tag)}/leaderboard`)
}

export type TagStatisticsData = {
  totalMarkets: number
  activeMarkets: number
  resolvedMarkets: number
  totalVolume: number
  totalTraders: number
  avgResolutionDays: number | null
  mostActiveMarket: {
    id: string
    question: string
    slug: string
    uniqueTradersCount: number
  } | null
}

export async function getTagStatistics({ tag }: { tag: string }): Promise<{ data: TagStatisticsData }> {
  return apiHandler(`${process.env.NEXT_PUBLIC_API_URL}/v1/tags/${encodeURIComponent(tag)}/stats`)
}

// User Following

export type FollowUser = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}

export async function followUser({ userId }: { userId: string }): Promise<{ data: { success: boolean } }> {
  return apiHandler<{ data: { success: boolean } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${encodeURIComponent(userId)}/follow`,
    { method: 'POST' }
  )
}

export async function unfollowUser({ userId }: { userId: string }): Promise<{ data: { success: boolean } }> {
  return apiHandler<{ data: { success: boolean } }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${encodeURIComponent(userId)}/follow`,
    { method: 'DELETE' }
  )
}

export async function getMyFollowing(): Promise<{ data: Array<FollowUser> }> {
  return apiHandler<{ data: Array<FollowUser> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/following`)
}

export async function getMyFollowers(): Promise<{ data: Array<FollowUser> }> {
  return apiHandler<{ data: Array<FollowUser> }>(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/followers`)
}

// User Public Profile

export type UserBadge = {
  id: string
  name: string
  description: string
  earned: boolean
  earnedAt: string | null
}

export type CalibrationBucket = {
  range: string
  minProbability: number
  maxProbability: number
  predictedAvg: number
  actualWinRate: number
  count: number
}

export type UserCalibrationScore = {
  brierScore: number
  calibrationScore: number
  totalPredictions: number
  resolvedPredictions: number
  buckets: Array<CalibrationBucket>
}

export type PortfolioHistoryPoint = {
  startAt: string
  endAt: string
  balance: number
  liquidity: number
  markets: number
}

export type UserPublicProfile = {
  stats: {
    marketsCreated: number
    totalTradeCount: number
    netWorth: number
    tradingVolume: number
    activeDayCount: number
    winRate: number
  }
  calibration: UserCalibrationScore
  badges: Array<UserBadge>
  portfolioHistory: Array<PortfolioHistoryPoint>
}

export async function getUserPublicProfile({ userId }: { userId: string }): Promise<{ data: UserPublicProfile }> {
  return apiHandler<{ data: UserPublicProfile }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${encodeURIComponent(userId)}/public-profile`
  )
}

export async function getUserCalibration({ userId }: { userId: string }): Promise<{ data: UserCalibrationScore }> {
  return apiHandler<{ data: UserCalibrationScore }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${encodeURIComponent(userId)}/calibration`
  )
}

export async function getUserBadges({ userId }: { userId: string }): Promise<{ data: Array<UserBadge> }> {
  return apiHandler<{ data: Array<UserBadge> }>(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${encodeURIComponent(userId)}/badges`
  )
}
