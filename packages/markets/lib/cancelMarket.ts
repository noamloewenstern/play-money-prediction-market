import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import { createComment } from '@play-money/comments/lib/createComment'
import db from '@play-money/database'
import { calculateBalanceChanges } from '@play-money/finance/lib/helpers'
import { updateGlobalBalances } from '@play-money/finance/lib/updateGlobalBalances'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { triggerWebhook } from '@play-money/webhooks/lib/triggerWebhook'
import { isMarketResolved, isMarketCanceled } from '../rules'
import { MarketCanceledError, MarketResolvedError } from './exceptions'
import { getMarket } from './getMarket'
import { getUniqueTraderIds } from './getUniqueTraderIds'
import { updateMarketBalances } from './updateMarketBalances'

export async function cancelMarket({
  canceledById,
  marketId,
  reason,
}: {
  canceledById: string
  marketId: string
  reason: string
}) {
  const market = await getMarket({ id: marketId, extended: true })

  if (isMarketResolved({ market })) {
    throw new MarketResolvedError()
  }

  if (isMarketCanceled({ market })) {
    throw new MarketCanceledError('Market already canceled')
  }

  const transactions = await db.transaction.findMany({
    where: {
      marketId: marketId,
      type: {
        in: [
          'TRADE_BUY',
          'TRADE_SELL',
          'TRADE_WIN',
          'TRADE_LOSS',
          'CREATOR_TRADER_BONUS',
          'LIQUIDITY_INITIALIZE',
          'LIQUIDITY_DEPOSIT',
          'LIQUIDITY_WITHDRAWAL',
          'LIQUIDITY_RETURNED',
          'LIQUIDITY_VOLUME_BONUS',
        ],
      },
      isReverse: null,
    },
    include: {
      entries: true,
      options: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const transactionIds = transactions.map((t) => t.id)
  const existingReverses = await db.transaction.findMany({
    where: { reverseOfId: { in: transactionIds } },
    select: { reverseOfId: true },
  })
  const reversedIds = new Set(existingReverses.map((r) => r.reverseOfId))

  for (const transaction of transactions) {
    if (reversedIds.has(transaction.id)) {
      continue
    }

    const { id: _, createdAt: __, updatedAt: ___, options, ...deconstructedTransaction } = transaction

    await db.$transaction(async (tx) => {
      const reverseTransaction = await tx.transaction.create({
        data: {
          ...deconstructedTransaction,
          isReverse: true,
          reverseOfId: transaction.id,
          entries: {
            createMany: {
              data: transaction.entries.map(
                ({ id: _, transactionId: __, createdAt: ___, fromAccountId, toAccountId, ...entry }) => ({
                  ...entry,
                  fromAccountId: toAccountId,
                  toAccountId: fromAccountId,
                })
              ),
            },
          },
          options: {
            connect: options?.map(({ id }) => ({ id })),
          },
        },
        include: {
          entries: true,
          options: true,
          initiator: true,
        },
      })

      const balanceChanges = calculateBalanceChanges({ entries: reverseTransaction.entries })

      await Promise.all([
        updateGlobalBalances({ tx, transactionType: reverseTransaction.type, balanceChanges }),
        updateMarketBalances({ tx, transactionType: reverseTransaction.type, balanceChanges, marketId }),
      ])
    })
  }

  await db.marketOptionPosition.updateMany({
    where: { marketId },
    data: {
      value: 0,
      cost: 0,
      quantity: 0,
    },
  })

  const now = new Date()
  await db.market.update({
    where: { id: marketId },
    data: { canceledAt: now, closedAt: now, canceledById },
  })

  const recipientIds = await getUniqueTraderIds(marketId, [canceledById])

  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        type: 'MARKET_CANCELED',
        actorId: canceledById,
        marketId: market.id,
        groupKey: market.id,
        userId: recipientId,
        actionUrl: `/questions/${market.id}/${market.slug}`,
      })
    )
  )

  await createComment({
    content: `<p><strong>CANCELATION REASON:</strong><br />${reason}</p>`,
    authorId: canceledById,
    parentId: null,
    entityType: 'MARKET',
    entityId: market.id,
  })

  await createAuditLog({
    action: 'MARKET_CANCEL',
    actorId: canceledById,
    targetType: 'Market',
    targetId: marketId,
    before: { canceledAt: null },
    after: { canceledAt: new Date().toISOString(), canceledById },
    metadata: { marketQuestion: market.question, reason },
  })

  void triggerWebhook({
    eventType: 'MARKET_CANCELED',
    marketId,
    payload: {
      marketId,
      question: market.question,
      canceledById,
      reason,
    },
  })
}
