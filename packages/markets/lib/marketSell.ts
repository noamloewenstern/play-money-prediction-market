import Decimal from 'decimal.js'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { triggerWebhook } from '@play-money/webhooks/lib/triggerWebhook'
import { isMarketTradable } from '../rules'
import { createMarketSellTransaction } from './createMarketSellTransaction'
import { MarketClosedError } from './exceptions'
import { getMarket } from './getMarket'

export async function marketSell({
  marketId,
  optionId,
  userId,
  amount,
}: {
  marketId: string
  optionId: string
  userId: string
  amount: Decimal
}) {
  const [market, userAccount] = await Promise.all([
    getMarket({ id: marketId }),
    getUserPrimaryAccount({ userId: userId }),
  ])
  if (!isMarketTradable({ market })) {
    throw new MarketClosedError()
  }

  const transaction = await createMarketSellTransaction({
    initiatorId: userId,
    accountId: userAccount.id,
    marketId,
    amount,
    optionId,
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
