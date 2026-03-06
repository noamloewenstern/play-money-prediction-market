import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import db from '@play-money/database'
import { getUniqueTraderIds } from '@play-money/markets/lib/getUniqueTraderIds'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getUserById } from '@play-money/users/lib/getUserById'
import { triggerWebhook } from '@play-money/webhooks/lib/triggerWebhook'
import { isMarketCanceled, isMarketResolved } from '../rules'
import { createMarketExcessLiquidityTransactions } from './createMarketExcessLiquidityTransactions'
import { MarketCanceledError, MarketResolvedError } from './exceptions'
import { createMarketResolveLossTransactions } from './createMarketResolveLossTransactions'
import { createMarketResolveWinTransactions } from './createMarketResolveWinTransactions'
import { getMarket } from './getMarket'
import { getMarketBookmarkUserIds } from './getMarketBookmarkUserIds'

export async function resolveMarket({
  resolverId,
  marketId,
  optionId,
  supportingLink,
}: {
  resolverId: string
  marketId: string
  optionId: string
  supportingLink?: string
}) {
  const market = await getMarket({ id: marketId, extended: true })
  const resolvingUser = await getUserById({ id: resolverId })

  if (isMarketResolved({ market })) {
    throw new MarketResolvedError()
  }

  if (isMarketCanceled({ market })) {
    throw new MarketCanceledError()
  }

  await db.$transaction(
    async (tx) => {
      const now = new Date()

      await tx.marketResolution.upsert({
        where: { marketId },
        create: {
          marketId,
          resolutionId: optionId,
          supportingLink,
          resolvedById: resolverId,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          resolutionId: optionId,
          supportingLink,
          resolvedById: resolverId,
          updatedAt: now,
        },
      })

      await tx.market.update({
        where: { id: marketId },
        data: { resolvedAt: now, closedAt: now, closeDate: now, updatedAt: now },
      })
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  )

  await createMarketResolveLossTransactions({
    marketId,
    initiatorId: resolverId,
    winningOptionId: optionId,
  })

  await createMarketResolveWinTransactions({
    marketId,
    initiatorId: resolverId,
    winningOptionId: optionId,
  })

  await createMarketExcessLiquidityTransactions({ marketId, initiatorId: resolverId })

  const recipientIds = await getUniqueTraderIds(marketId, [resolvingUser.id])

  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        type: 'MARKET_RESOLVED',
        actorId: resolverId,
        marketId: market.id,
        marketOptionId: optionId,
        groupKey: market.id,
        userId: recipientId,
        actionUrl: `/questions/${market.id}/${market.slug}`,
      })
    )
  )

  // Notify users who bookmarked this market (excluding resolver and traders already notified)
  const bookmarkUserIds = await getMarketBookmarkUserIds({ marketId })
  const traderIdSet = new Set(recipientIds)
  const bookmarkOnlyRecipients = bookmarkUserIds.filter((id) => id !== resolvingUser.id && !traderIdSet.has(id))

  await Promise.all(
    bookmarkOnlyRecipients.map((recipientId) =>
      createNotification({
        type: 'MARKET_BOOKMARK_RESOLVED',
        actorId: resolverId,
        marketId: market.id,
        marketOptionId: optionId,
        groupKey: market.id,
        userId: recipientId,
        actionUrl: `/questions/${market.id}/${market.slug}`,
      })
    )
  )

  const resolvedOption = market.options.find((o) => o.id === optionId)
  await createAuditLog({
    action: 'MARKET_RESOLVE',
    actorId: resolverId,
    targetType: 'Market',
    targetId: marketId,
    before: { resolvedAt: null },
    after: { resolvedAt: new Date().toISOString(), resolutionOptionId: optionId, resolutionOptionName: resolvedOption?.name },
    metadata: { marketQuestion: market.question, supportingLink },
  })

  void triggerWebhook({
    eventType: 'MARKET_RESOLVED',
    marketId,
    payload: {
      marketId,
      question: market.question,
      resolverId,
      optionId,
      optionName: resolvedOption?.name,
      supportingLink,
    },
  })
}
