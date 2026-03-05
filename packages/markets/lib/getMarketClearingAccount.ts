import db from '@play-money/database'
import { MarketAccountNotFoundError } from './exceptions'

export async function getMarketClearingAccount({ marketId }: { marketId: string }) {
  const account = await db.account.findFirst({
    where: {
      type: 'MARKET_CLEARING',
      marketId,
    },
  })

  if (!account) {
    throw new MarketAccountNotFoundError('Market clearing account does not exist')
  }

  return account
}
