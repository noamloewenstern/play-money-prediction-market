import { differenceInDays } from 'date-fns'
import db from '@play-money/database'

type ReputationBreakdown = {
  resolutionRate: number
  timeliness: number
  traderAttraction: number
  volumeGenerated: number
  communityEngagement: number
}

export type CreatorReputation = {
  score: number
  totalMarkets: number
  resolvedMarkets: number
  canceledMarkets: number
  breakdown: ReputationBreakdown
}

const WEIGHTS = {
  resolutionRate: 0.3,
  timeliness: 0.2,
  traderAttraction: 0.25,
  volumeGenerated: 0.15,
  communityEngagement: 0.1,
}

// Thresholds for trader attraction scoring (avg unique traders per market)
const TRADER_EXCELLENT = 20
// Thresholds for volume scoring (avg liquidity count per market)
const VOLUME_EXCELLENT = 5000
// Thresholds for engagement scoring (avg comments per market)
const ENGAGEMENT_EXCELLENT = 10
// Max acceptable days to resolve after close date
const TIMELINESS_MAX_DAYS = 30

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getCreatorReputation({ userId }: { userId: string }): Promise<CreatorReputation> {
  const markets = await db.market.findMany({
    where: { createdBy: userId },
    select: {
      id: true,
      resolvedAt: true,
      canceledAt: true,
      closeDate: true,
      closedAt: true,
      uniqueTradersCount: true,
      liquidityCount: true,
      commentCount: true,
      createdAt: true,
    },
  })

  const totalMarkets = markets.length

  if (totalMarkets === 0) {
    return {
      score: 0,
      totalMarkets: 0,
      resolvedMarkets: 0,
      canceledMarkets: 0,
      breakdown: {
        resolutionRate: 0,
        timeliness: 0,
        traderAttraction: 0,
        volumeGenerated: 0,
        communityEngagement: 0,
      },
    }
  }

  const resolvedMarkets = markets.filter((m) => m.resolvedAt != null)
  const canceledMarkets = markets.filter((m) => m.canceledAt != null)
  const completedMarkets = markets.filter((m) => m.resolvedAt != null || m.canceledAt != null)

  // 1. Resolution Rate: resolved / (resolved + canceled), or resolved / total if none completed yet
  let resolutionRateScore = 0
  if (completedMarkets.length > 0) {
    resolutionRateScore = (resolvedMarkets.length / completedMarkets.length) * 100
  } else if (totalMarkets > 0) {
    // All markets still active - give benefit of the doubt but cap at 50
    resolutionRateScore = 50
  }

  // 2. Timeliness: How quickly resolved markets are resolved relative to close date
  let timelinessScore = 100
  if (resolvedMarkets.length > 0) {
    const timelinessScores = resolvedMarkets.map((m) => {
      if (!m.closeDate || !m.resolvedAt) return 100
      const daysAfterClose = differenceInDays(m.resolvedAt, m.closeDate)
      if (daysAfterClose <= 0) return 100 // Resolved before or on close date
      return clamp(100 - (daysAfterClose / TIMELINESS_MAX_DAYS) * 100, 0, 100)
    })
    timelinessScore = timelinessScores.reduce((sum, s) => sum + s, 0) / timelinessScores.length
  }

  // 3. Trader Attraction: avg unique traders per market
  const avgTraders =
    markets.reduce((sum, m) => sum + (m.uniqueTradersCount || 0), 0) / totalMarkets
  const traderAttractionScore = clamp((avgTraders / TRADER_EXCELLENT) * 100, 0, 100)

  // 4. Volume Generated: avg liquidity per market
  const avgVolume =
    markets.reduce((sum, m) => sum + (m.liquidityCount || 0), 0) / totalMarkets
  const volumeGeneratedScore = clamp((avgVolume / VOLUME_EXCELLENT) * 100, 0, 100)

  // 5. Community Engagement: avg comments per market
  const avgComments =
    markets.reduce((sum, m) => sum + (m.commentCount || 0), 0) / totalMarkets
  const communityEngagementScore = clamp((avgComments / ENGAGEMENT_EXCELLENT) * 100, 0, 100)

  const breakdown: ReputationBreakdown = {
    resolutionRate: Math.round(resolutionRateScore),
    timeliness: Math.round(timelinessScore),
    traderAttraction: Math.round(traderAttractionScore),
    volumeGenerated: Math.round(volumeGeneratedScore),
    communityEngagement: Math.round(communityEngagementScore),
  }

  const weightedScore =
    resolutionRateScore * WEIGHTS.resolutionRate +
    timelinessScore * WEIGHTS.timeliness +
    traderAttractionScore * WEIGHTS.traderAttraction +
    volumeGeneratedScore * WEIGHTS.volumeGenerated +
    communityEngagementScore * WEIGHTS.communityEngagement

  return {
    score: Math.round(clamp(weightedScore, 0, 100)),
    totalMarkets,
    resolvedMarkets: resolvedMarkets.length,
    canceledMarkets: canceledMarkets.length,
    breakdown,
  }
}
