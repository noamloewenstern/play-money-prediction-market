import Decimal from 'decimal.js'
import db, { Balance, MarketOptionPosition } from '@play-money/database'
import { AssetTypeType } from '@play-money/database/zod/inputTypeSchemas/AssetTypeSchema'
import { getMarket } from '@play-money/markets/lib/getMarket'

export type NetBalance = Omit<Balance, 'subtotals'> & { subtotals: Record<string, number> }
export type NetBalanceAsNumbers = Omit<Balance, 'total' | 'subtotals'> & {
  total: number
  subtotals: Record<string, number>
}

export type MarketOptionPositionAsNumbers = Omit<MarketOptionPosition, 'value' | 'cost' | 'quantity'> & {
  value: number
  cost: number
  quantity: number
}

export async function getBalance({
  accountId,
  assetType,
  assetId,
  marketId,
}: {
  accountId: string
  assetType: AssetTypeType
  assetId: string
  marketId?: string
}): Promise<NetBalance> {
  const balance = await db.balance.findFirst({
    where: {
      accountId,
      assetType,
      assetId,
      marketId: marketId ?? null,
    },
  })

  if (!balance) {
    throw new Error('No balance')
  }

  return balance as unknown as NetBalance
}

export async function getMarketBalances({
  accountId,
  marketId,
}: {
  accountId: string
  marketId: string
}): Promise<Array<NetBalance>> {
  const market = await getMarket({ id: marketId, extended: true })

  const conditions = [
    { assetType: 'CURRENCY' as const, assetId: 'PRIMARY', marketId },
    ...(market?.options || []).map((option) => ({
      assetType: 'MARKET_OPTION' as const,
      assetId: option.id,
      marketId,
    })),
  ]

  const balances = await db.balance.findMany({
    where: {
      accountId,
      OR: conditions,
    },
  })

  return balances as unknown as Array<NetBalance>
}

export async function getListBalances({
  accountId,
  listId,
}: {
  accountId: string
  listId: string
}): Promise<Array<NetBalance>> {
  const list = await db.list.findUnique({
    where: { id: listId },
    include: {
      markets: {
        include: {
          market: {
            include: {
              options: true,
            },
          },
        },
      },
    },
  })

  if (!list?.markets.length) {
    return []
  }

  const conditions = list.markets.flatMap((m) => [
    { assetType: 'CURRENCY' as const, assetId: 'PRIMARY', marketId: m.market.id },
    ...m.market.options.map((option) => ({
      assetType: 'MARKET_OPTION' as const,
      assetId: option.id,
      marketId: m.market.id,
    })),
  ])

  const balances = await db.balance.findMany({
    where: {
      accountId,
      OR: conditions,
    },
  })

  return balances as unknown as Array<NetBalance>
}

export function transformMarketBalancesToNumbers(balances: Array<NetBalance> = []): Array<NetBalanceAsNumbers> {
  return balances.map((balance) => ({
    ...balance,
    total: balance.total.toNumber(),
  }))
}

export function transformMarketOptionPositionToNumbers(
  positions: Array<MarketOptionPosition> = []
): Array<MarketOptionPositionAsNumbers> {
  return positions.map((balance) => ({
    ...balance,
    value: balance.value.toNumber(),
    cost: balance.cost.toNumber(),
    quantity: balance.quantity.toNumber(),
  }))
}
