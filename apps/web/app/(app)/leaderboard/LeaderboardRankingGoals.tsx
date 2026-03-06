import { TargetIcon, TrendingUpIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { getMarkets } from '@play-money/api-helpers/client'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import type { LeaderboardUser } from '@play-money/finance/types'
import { Button } from '@play-money/ui/button'
import { cn } from '@play-money/ui/utils'

type RankingThresholds = {
  top10: number
  top20: number
  top50: number
}

type CategoryKey = 'trader' | 'creator' | 'promoter' | 'quester' | 'referrer'

const CATEGORY_LABELS: Record<CategoryKey, { name: string; thresholdKey: string }> = {
  trader: { name: 'Trading', thresholdKey: 'traders' },
  creator: { name: 'Creating', thresholdKey: 'creators' },
  promoter: { name: 'Promoting', thresholdKey: 'promoters' },
  quester: { name: 'Quests', thresholdKey: 'questers' },
  referrer: { name: 'Referrals', thresholdKey: 'referrers' },
}

function ThresholdRow({
  label,
  value,
  userTotal,
}: {
  label: string
  value: number
  userTotal: number
}) {
  const reached = userTotal >= value && value > 0
  return (
    <div className={cn('flex items-center justify-between py-1.5', reached && 'text-green-600')}>
      <span className="text-sm">{label}</span>
      <span className="tabular-nums text-sm font-medium">
        <CurrencyDisplay isShort value={value} />
      </span>
    </div>
  )
}

export async function LeaderboardRankingGoals({
  userRankings,
  rankingThresholds,
}: {
  userRankings?: {
    trader?: LeaderboardUser
    creator?: LeaderboardUser
    promoter?: LeaderboardUser
    quester?: LeaderboardUser
    referrer?: LeaderboardUser
  }
  rankingThresholds: Record<string, RankingThresholds>
}) {
  if (!userRankings) {
    return null
  }

  // Find the user's best category (lowest rank number = best)
  const categories: Array<CategoryKey> = ['trader', 'creator', 'promoter', 'quester', 'referrer']
  const bestCategory = categories.reduce<{ key: CategoryKey; ranking: LeaderboardUser } | null>((best, key) => {
    const ranking = userRankings[key]
    if (!ranking) return best
    if (!best || ranking.rank < best.ranking.rank) {
      return { key, ranking }
    }
    return best
  }, null)

  // If user is already in top 10 of their best category, don't show this component
  if (!bestCategory || bestCategory.ranking.rank <= 10) {
    return null
  }

  const { key: bestKey, ranking: userBest } = bestCategory
  const label = CATEGORY_LABELS[bestKey]
  const thresholds = rankingThresholds[label.thresholdKey]

  const trendingMarkets = await getMarkets({ limit: 3 }).catch(() => ({
    data: [],
    pageInfo: { hasNextPage: false, total: 0 },
  }))

  return (
    <div className="mx-auto mb-8 w-full max-w-md">
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-soft">
        <div className="flex flex-col items-center gap-1 border-b bg-muted px-4 py-4">
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10">
            <TargetIcon className="size-5 text-primary" />
          </div>
          <h4 className="text-base font-semibold">What it takes to rank</h4>
          <p className="text-center text-xs text-muted-foreground">
            You&apos;re currently <span className="font-semibold">#{userBest.rank}</span> in {label.name} with{' '}
            <CurrencyDisplay isShort value={userBest.total} />
          </p>
        </div>

        <div className="divide-y px-4">
          <ThresholdRow label="Top 50" userTotal={userBest.total} value={thresholds.top50} />
          <ThresholdRow label="Top 20" userTotal={userBest.total} value={thresholds.top20} />
          <ThresholdRow label="Top 10" userTotal={userBest.total} value={thresholds.top10} />
        </div>

        {trendingMarkets.data.length > 0 ? (
          <div className="border-t px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active markets</p>
            <div className="divide-y rounded-lg border text-sm">
              {trendingMarkets.data.map((market) => {
                const mostLikelyOption = market.options.reduce((prev, current) =>
                  (prev.probability || 0) > (current.probability || 0) ? prev : current
                )

                return (
                  <Link
                    className="flex items-center justify-between px-3 py-2 transition-colors hover:bg-muted/30"
                    href={`/questions/${market.id}/${market.slug}`}
                    key={market.id}
                  >
                    <span className="mr-3 line-clamp-1 text-xs">{market.question}</span>
                    {!market.canceledAt && !market.marketResolution ? (
                      <span
                        className="flex-shrink-0 tabular-nums text-xs font-semibold"
                        style={{ color: mostLikelyOption.color }}
                      >
                        {Math.round(mostLikelyOption.probability || 0)}%
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="border-t px-4 py-3">
          <Link className="block" href="/questions">
            <Button className="w-full" size="sm">
              <TrendingUpIcon className="mr-2 size-4" />
              Start Climbing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
