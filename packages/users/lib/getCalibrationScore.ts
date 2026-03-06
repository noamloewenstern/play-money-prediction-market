import db from '@play-money/database'
import { getUserPrimaryAccount } from './getUserPrimaryAccount'

type CalibrationBucket = {
  range: string
  minProbability: number
  maxProbability: number
  predictedAvg: number
  actualWinRate: number
  count: number
}

export type CalibrationScore = {
  brierScore: number
  calibrationScore: number
  totalPredictions: number
  resolvedPredictions: number
  buckets: Array<CalibrationBucket>
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getCalibrationScore({ userId }: { userId: string }): Promise<CalibrationScore> {
  const userAccount = await getUserPrimaryAccount({ userId })

  // Get all TRADE_BUY transactions for resolved markets
  const buyTransactions = await db.transaction.findMany({
    where: {
      initiatorId: userId,
      type: 'TRADE_BUY',
      isReverse: null,
      marketId: { not: null },
      market: { resolvedAt: { not: null } },
    },
    select: {
      id: true,
      marketId: true,
      market: {
        select: { id: true, resolvedAt: true },
      },
      entries: {
        select: { assetType: true, assetId: true, fromAccountId: true, toAccountId: true, amount: true },
      },
    },
  })

  if (buyTransactions.length === 0) {
    return {
      brierScore: 0,
      calibrationScore: 0,
      totalPredictions: 0,
      resolvedPredictions: 0,
      buckets: [],
    }
  }

  const marketIds = Array.from(new Set(buyTransactions.map((t) => t.marketId).filter(Boolean))) as Array<string>

  // Get trade notes for probability at trade time
  const tradeNotes = await db.tradeNote.findMany({
    where: {
      userId,
      marketId: { in: marketIds },
      transactionId: { in: buyTransactions.map((t) => t.id) },
    },
    select: { transactionId: true, probabilityAtTrade: true, optionId: true },
  })
  const tradeNoteMap = new Map(tradeNotes.map((n) => [n.transactionId, n]))

  // Determine win/loss per market
  const [winTransactions, lossTransactions] = await Promise.all([
    db.transaction.findMany({
      where: {
        initiatorId: userId,
        type: 'TRADE_WIN',
        isReverse: null,
        marketId: { in: marketIds },
      },
      select: { marketId: true },
    }),
    db.transaction.findMany({
      where: {
        initiatorId: userId,
        type: 'TRADE_LOSS',
        isReverse: null,
        marketId: { in: marketIds },
      },
      select: { marketId: true },
    }),
  ])

  const marketsWithWin = new Set(winTransactions.map((t) => t.marketId).filter(Boolean) as Array<string>)
  const marketsWithLoss = new Set(lossTransactions.map((t) => t.marketId).filter(Boolean) as Array<string>)

  // For each buy transaction in a resolved market, compute Brier score contribution
  type Prediction = { probability: number; outcome: number }
  const predictions: Array<Prediction> = []

  // Group transactions by market to compute per-market outcome
  const txsByMarket = new Map<string, Array<(typeof buyTransactions)[0]>>()
  for (const tx of buyTransactions) {
    if (!tx.marketId) continue
    const existing = txsByMarket.get(tx.marketId) || []
    existing.push(tx)
    txsByMarket.set(tx.marketId, existing)
  }

  for (const [marketId, txs] of txsByMarket.entries()) {
    const hasWin = marketsWithWin.has(marketId)
    const hasLoss = marketsWithLoss.has(marketId)
    // Outcome: 1 if won, 0 if lost (if neither, skip as still pending)
    if (!hasWin && !hasLoss) continue
    const outcome = hasWin ? 1 : 0

    for (const tx of txs) {
      const note = tradeNoteMap.get(tx.id)
      // Use probabilityAtTrade if available, else default to 50 (neutral)
      const probabilityPct = note?.probabilityAtTrade ?? 50
      predictions.push({ probability: probabilityPct / 100, outcome })
    }
  }

  if (predictions.length === 0) {
    return {
      brierScore: 0,
      calibrationScore: 0,
      totalPredictions: buyTransactions.length,
      resolvedPredictions: 0,
      buckets: [],
    }
  }

  // Compute Brier score: mean of (p - o)^2
  const brierScore = predictions.reduce((sum, p) => sum + Math.pow(p.probability - p.outcome, 2), 0) / predictions.length

  // Convert to calibration score: 100 = perfect, 0 = random (Brier 0.25)
  // Scores below random are clamped to 0
  const calibrationScore = Math.round(clamp((1 - brierScore / 0.25) * 100, 0, 100))

  // Build calibration buckets (10 decile buckets)
  const bucketDefs = [
    { range: '0-10%', min: 0, max: 0.1 },
    { range: '10-20%', min: 0.1, max: 0.2 },
    { range: '20-30%', min: 0.2, max: 0.3 },
    { range: '30-40%', min: 0.3, max: 0.4 },
    { range: '40-50%', min: 0.4, max: 0.5 },
    { range: '50-60%', min: 0.5, max: 0.6 },
    { range: '60-70%', min: 0.6, max: 0.7 },
    { range: '70-80%', min: 0.7, max: 0.8 },
    { range: '80-90%', min: 0.8, max: 0.9 },
    { range: '90-100%', min: 0.9, max: 1.0 },
  ]

  const buckets: Array<CalibrationBucket> = bucketDefs
    .map((def) => {
      const inBucket = predictions.filter((p) => p.probability >= def.min && p.probability <= def.max)
      if (inBucket.length === 0) return null
      const predictedAvg = inBucket.reduce((s, p) => s + p.probability, 0) / inBucket.length
      const actualWinRate = inBucket.reduce((s, p) => s + p.outcome, 0) / inBucket.length
      return {
        range: def.range,
        minProbability: def.min * 100,
        maxProbability: def.max * 100,
        predictedAvg: Math.round(predictedAvg * 100),
        actualWinRate: Math.round(actualWinRate * 100),
        count: inBucket.length,
      }
    })
    .filter((b): b is CalibrationBucket => b !== null)

  return {
    brierScore: Math.round(brierScore * 10000) / 10000,
    calibrationScore,
    totalPredictions: buyTransactions.length,
    resolvedPredictions: predictions.length,
    buckets,
  }
}
