import Decimal from 'decimal.js'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
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

  await createMarketSellTransaction({
    initiatorId: userId,
    accountId: userAccount.id,
    marketId,
    amount,
    optionId,
  })
}
