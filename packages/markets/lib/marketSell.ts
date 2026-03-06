import Decimal from 'decimal.js'
import db from '@play-money/database'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { triggerWebhook } from '@play-money/webhooks/lib/triggerWebhook'
import { isMarketResolved, isMarketTradable } from '../rules'
import { createMarketSellTransaction } from './createMarketSellTransaction'
import { MarketClosedError } from './exceptions'
import { getMarket } from './getMarket'
import { createTradeNote } from './createTradeNote'
import { createProbabilitySnapshot } from './createProbabilitySnapshot'

export async function marketSell({
  marketId,
  optionId,
  userId,
  amount,
  note,
}: {
  marketId: string
  optionId: string
  userId: string
  amount: Decimal
  note?: string
}) {
  const [market, userAccount] = await Promise.all([
    getMarket({ id: marketId }),
    getUserPrimaryAccount({ userId: userId }),
  ])
  if (!isMarketTradable({ market })) {
    const reason = isMarketResolved({ market })
      ? 'This market has been resolved and is no longer accepting trades.'
      : 'This market is closed and is no longer accepting trades.'
    throw new MarketClosedError(reason)
  }

  // Capture probability before the trade changes it
  const optionBeforeTrade = await db.marketOption.findUnique({
    where: { id: optionId },
    select: { probability: true },
  })
  const probabilityAtTrade = optionBeforeTrade?.probability ?? undefined

  const transaction = await createMarketSellTransaction({
    initiatorId: userId,
    accountId: userAccount.id,
    marketId,
    amount,
    optionId,
  })

  // Always create a trade note to capture probability; store user note if provided
  void createTradeNote({
    userId,
    marketId,
    optionId,
    transactionId: transaction.id,
    tradeType: 'SELL',
    note,
    probabilityAtTrade,
  }).catch(() => {
    // Non-critical: don't fail the trade if note creation fails
  })

  // Capture a probability snapshot after each trade for time-series charts
  void createProbabilitySnapshot({ marketId, source: 'TRADE' }).catch(() => {
    // Non-critical: don't fail the trade if snapshot creation fails
  })

  void triggerWebhook({
    eventType: 'TRADE_EXECUTED',
    marketId,
    payload: {
      marketId,
      question: market.question,
      optionId,
      userId,
      amount: amount.toString(),
      type: 'SELL',
      transactionId: transaction.id,
    },
  })
}
