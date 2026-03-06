import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getMarket } from '@play-money/markets/lib/getMarket'
import { getMarketTransactionsTimeSeries } from '@play-money/markets/lib/getMarketTransactionsTimeSeries'
import { getProbabilitySnapshotsTimeSeries } from '@play-money/markets/lib/getProbabilitySnapshots'
import { getMarketVolumeTimeSeries } from '@play-money/markets/lib/getMarketVolumeTimeSeries'
import schema from './schema'

export const dynamic = 'force-dynamic'

// Minimum number of stored snapshots to prefer them over on-demand calculation
const MIN_SNAPSHOTS_THRESHOLD = 2

export async function GET(
  _req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const { id } = schema.get.parameters.parse(params)
    const market = await getMarket({ id })

    const endAt = market.resolvedAt || new Date()

    // Fetch volume data in parallel for all paths
    const [snapshotTimeSeries, volumeTimeSeries] = await Promise.all([
      getProbabilitySnapshotsTimeSeries({
        marketId: id,
        startAt: market.createdAt,
        endAt,
        tickInterval: 1,
      }),
      getMarketVolumeTimeSeries({
        marketId: id,
        startAt: market.createdAt,
        endAt,
        tickInterval: 1,
      }),
    ])

    const volumeMap = new Map(volumeTimeSeries.map((v) => [v.startAt.getTime(), v]))

    if (snapshotTimeSeries.length >= MIN_SNAPSHOTS_THRESHOLD) {
      const data = snapshotTimeSeries.map((item) => {
        const volumeItem = volumeMap.get(item.startAt.getTime())
        return { ...item, volume: volumeItem?.volume ?? 0, tradeCount: volumeItem?.tradeCount ?? 0 }
      })
      return NextResponse.json({ data })
    }

    // Fall back to on-demand transaction replay if not enough snapshots
    const transactionTimeSeries = await getMarketTransactionsTimeSeries({
      marketId: id,
      tickInterval: 1,
      endAt,
      excludeTransactionTypes: ['TRADE_LOSS', 'TRADE_WIN', 'LIQUIDITY_RETURNED'],
    })

    const data = transactionTimeSeries.map((item) => {
      const volumeItem = volumeMap.get(item.startAt.getTime())
      return { ...item, volume: volumeItem?.volume ?? 0, tradeCount: volumeItem?.tradeCount ?? 0 }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
