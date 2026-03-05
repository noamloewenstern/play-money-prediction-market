import { addDays, isWithinInterval } from 'date-fns'
import db, { Transaction } from '@play-money/database'
import { MarketActivity } from '@play-money/markets/types'
import { TransactionWithEntries } from '../types'

type ActivityInput = {
  cursor?: Date
  limit?: number
  granularityDays?: number
}

export async function getSiteActivity({
  cursor = new Date(),
  limit = 15,
  granularityDays = 1,
}: ActivityInput): Promise<Array<MarketActivity>> {
  const [transactions, newMarkets, newLists, resolvedMarkets] = await Promise.all([
    db.transaction.findMany({
      where: {
        createdAt: { lt: cursor },
        type: {
          in: ['TRADE_BUY', 'TRADE_SELL', 'LIQUIDITY_DEPOSIT', 'LIQUIDITY_WITHDRAWAL'],
        },
        initiatorId: {
          not: null,
        },
        isReverse: null,
      },
      include: {
        entries: true,
        market: true,
        initiator: true,
        options: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.market.findMany({
      where: {
        createdAt: { lt: cursor },
        parentListId: null,
        resolvedAt: null,
        closeDate: {
          gte: new Date(),
        },
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.list.findMany({
      where: {
        createdAt: { lt: cursor },
        markets: {
          every: {
            market: {
              resolvedAt: null,
              closeDate: {
                gte: new Date(),
              },
            },
          },
        },
      },
      include: {
        owner: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.marketResolution.findMany({
      where: {
        createdAt: { lt: cursor },
      },
      include: {
        resolution: true,
        resolvedBy: true,
        market: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const nonGroupedActivities: Array<MarketActivity> = []

  nonGroupedActivities.push(
    ...newMarkets.map((market) => ({
      type: 'MARKET_CREATED' as const,
      timestampAt: market.createdAt,
      market: market,
    }))
  )

  nonGroupedActivities.push(
    ...newLists.map((list) => ({
      type: 'LIST_CREATED' as const,
      timestampAt: list.createdAt,
      list: list,
    }))
  )

  nonGroupedActivities.push(
    ...resolvedMarkets.map((marketResolution) => ({
      type: 'MARKET_RESOLVED' as const,
      timestampAt: marketResolution.createdAt,
      marketResolution,
    }))
  )

  const initialGroups = groupTransactionsByType(transactions, granularityDays)

  // Split groups based on other activities
  const finalActivities = mergeAndSplitActivities(initialGroups, nonGroupedActivities, granularityDays)

  // Sort all activities by timestamp descending
  finalActivities.sort((a, b) => b.timestampAt.getTime() - a.timestampAt.getTime())

  // Apply limit
  return finalActivities.slice(0, limit)
}

function groupTransactionsByType(
  transactions: Array<TransactionWithEntries>,
  granularityDays: number
): Array<MarketActivity> {
  const sortedTransactions = [...transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const buckets: Record<string, Array<TransactionWithEntries>> = {}
  // Map from composite key (type-option-market) to the most recent bucket key for O(1) lookup
  const bucketKeyMap = new Map<string, string>()

  for (const transaction of sortedTransactions) {
    const transactionType = transactionToActivityType(transaction)
    const option = transaction.options?.[0]
    const compositeKey = `${transactionType}_${option?.id || 'none'}_${transaction.market?.id || 'none'}`

    let foundBucket = false
    const existingBucketKey = bucketKeyMap.get(compositeKey)

    if (existingBucketKey && buckets[existingBucketKey]) {
      const existingTransactions = buckets[existingBucketKey]
      const existingTime = existingTransactions[0].createdAt

      const isWithinGranularity = isWithinInterval(transaction.createdAt, {
        start: addDays(existingTime, -granularityDays),
        end: addDays(existingTime, granularityDays),
      })

      if (isWithinGranularity) {
        buckets[existingBucketKey].push(transaction)
        foundBucket = true
      }
    }

    if (!foundBucket) {
      // Create new bucket if no matching bucket found
      const newKey = `${transaction.createdAt.getTime()}_${compositeKey}`
      buckets[newKey] = [transaction]
      bucketKeyMap.set(compositeKey, newKey)
    }
  }

  // Convert buckets to activities
  return Object.values(buckets).map((bucketTransactions) => ({
    transactions: bucketTransactions,
    timestampAt: bucketTransactions[0].createdAt,
    type: transactionToActivityType(bucketTransactions[0]),
    option: bucketTransactions[0].options?.[0],
  }))
}

function mergeAndSplitActivities(
  transactionGroups: Array<MarketActivity>,
  nonGroupedActivities: Array<MarketActivity>,
  granularityDays: number
): Array<MarketActivity> {
  const allActivities: Array<MarketActivity> = [...nonGroupedActivities]
  const timePoints = [...nonGroupedActivities].sort((a, b) => b.timestampAt.getTime() - a.timestampAt.getTime())

  for (const group of transactionGroups) {
    const subgroups = splitTransactionGroup(group, timePoints, granularityDays)

    allActivities.push(...subgroups)
  }

  return allActivities
}

function splitTransactionGroup(
  group: MarketActivity,
  timePoints: Array<MarketActivity>,
  granularityDays: number
): Array<MarketActivity> {
  const result: Array<MarketActivity> = []
  let currentTransactions: any[] = []
  let currentTimestamp = group.transactions![0].createdAt

  // timePoints is sorted descending. Use a pointer to avoid re-scanning from the start.
  // Transactions are also sorted descending, so both currentTimestamp and transaction.createdAt decrease over time.
  let timePointIdx = 0

  for (const transaction of group.transactions!) {
    const transactionTime = transaction.createdAt.getTime()
    const currentTime = currentTimestamp.getTime()

    // Advance pointer past timePoints that are >= currentTimestamp (not between current and transaction)
    while (timePointIdx < timePoints.length && timePoints[timePointIdx].timestampAt.getTime() >= currentTime) {
      timePointIdx++
    }

    // Check timePoints starting from pointer for a split point between transaction and currentTimestamp
    let splitPoint: MarketActivity | undefined
    for (let i = timePointIdx; i < timePoints.length; i++) {
      const pointTime = timePoints[i].timestampAt.getTime()
      if (pointTime <= transactionTime) {
        // Past the window — no more candidates since timePoints is sorted descending
        break
      }
      if (
        pointTime > transactionTime &&
        pointTime < currentTime &&
        isWithinInterval(timePoints[i].timestampAt, {
          start: addDays(currentTimestamp, -granularityDays),
          end: addDays(currentTimestamp, granularityDays),
        })
      ) {
        splitPoint = timePoints[i]
        break
      }
    }

    if (splitPoint && currentTransactions.length > 0) {
      // Create a new group with accumulated transactions
      result.push({
        transactions: currentTransactions,
        timestampAt: currentTimestamp,
        type: group.type,
        option: group.transactions![0].options?.[0],
      })
      // Start a new group
      currentTransactions = [transaction]
      currentTimestamp = transaction.createdAt
    } else {
      currentTransactions.push(transaction)
    }
  }

  // Add the final group
  if (currentTransactions.length > 0) {
    result.push({
      transactions: currentTransactions,
      timestampAt: currentTimestamp,
      type: group.type,
      option: group.transactions![0].options?.[0],
    })
  }

  return result
}

function transactionToActivityType(transaction: Transaction): 'TRADE_TRANSACTION' | 'LIQUIDITY_TRANSACTION' {
  if (transaction.type === 'TRADE_BUY' || transaction.type === 'TRADE_SELL') {
    return 'TRADE_TRANSACTION'
  } else if (transaction.type === 'LIQUIDITY_DEPOSIT' || transaction.type === 'LIQUIDITY_WITHDRAWAL') {
    return 'LIQUIDITY_TRANSACTION'
  } else {
    throw new Error('Invalid transaction type')
  }
}
