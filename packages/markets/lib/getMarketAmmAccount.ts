import db from '@play-money/database'
import { MarketAccountNotFoundError } from './exceptions'

export async function getMarketAmmAccount({ marketId }: { marketId: string }) {
  const account = await db.account.findFirst({
    where: {
      type: 'MARKET_AMM',
      marketId,
    },
  })

  if (!account) {
    throw new MarketAccountNotFoundError('Market amm account does not exist')
  }

  return account
}
