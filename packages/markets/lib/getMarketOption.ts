import db from '@play-money/database'
import { MarketOptionNotFoundError } from './exceptions'

export async function getMarketOption({ id, marketId }: { id: string; marketId?: string }) {
  const marketOption = await db.marketOption.findUnique({ where: { id, marketId } })

  if (!marketOption) {
    throw new MarketOptionNotFoundError()
  }

  return marketOption
}
