import { TrendingDownIcon, TrendingUpIcon, BarChart2Icon, TargetIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { getUserPortfolioAnalytics, type PortfolioAnalytics } from '@play-money/api-helpers/client'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { Badge } from '@play-money/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@play-money/ui/table'
import { cn } from '@play-money/ui/utils'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  valueClassName,
}: {
  title: string
  value: React.ReactNode
  description?: string
  icon: React.ComponentType<{ className?: string }>
  valueClassName?: string
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{title}</div>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className={cn('mt-1 text-2xl font-bold', valueClassName)}>{value}</div>
        {description ? <div className="mt-0.5 text-xs text-muted-foreground">{description}</div> : null}
      </CardContent>
    </Card>
  )
}

function CategoryBreakdown({ categories }: { categories: PortfolioAnalytics['categoryBreakdown'] }) {
  if (categories.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">No category data available.</div>
  }

  const maxAbsPnl = Math.max(...categories.map((c) => Math.abs(c.totalPnl)), 1)

  return (
    <div className="space-y-2">
      {categories.slice(0, 10).map((cat) => {
        const barWidth = (Math.abs(cat.totalPnl) / maxAbsPnl) * 100
        const isPositive = cat.totalPnl >= 0

        return (
          <div key={cat.tag} className="flex items-center gap-3">
            <div className="w-24 shrink-0 truncate text-right text-sm font-medium" title={cat.tag}>
              {cat.tag}
            </div>
            <div className="relative flex h-7 flex-1 items-center rounded-md bg-muted">
              <div
                className={cn('absolute h-full rounded-md opacity-80', isPositive ? 'bg-success' : 'bg-destructive')}
                style={{ width: `${barWidth}%` }}
              />
              <span
                className={cn(
                  'relative z-10 ml-2 text-xs font-semibold',
                  isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {isPositive ? '+' : ''}
                {cat.totalPnl.toFixed(0)}
              </span>
            </div>
            <div className="w-14 shrink-0 text-right text-xs text-muted-foreground">{cat.marketCount} mkt</div>
          </div>
        )
      })}
    </div>
  )
}

function MarketResultsTable({
  results,
  emptyMessage,
}: {
  results: PortfolioAnalytics['largestWins']
  emptyMessage: string
}) {
  if (results.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Market</TableHead>
          <TableHead className="w-[100px] text-right">Invested</TableHead>
          <TableHead className="w-[100px] text-right">P&amp;L</TableHead>
          <TableHead className="hidden w-[80px] text-right sm:table-cell">Return</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <Link
            href={`/questions/${result.marketId}/${result.marketSlug}`}
            legacyBehavior
            key={result.marketId}
          >
            <TableRow className="cursor-pointer">
              <TableCell>
                <div className="line-clamp-2 text-sm">{result.marketQuestion}</div>
                {result.resolvedAt ? (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay value={result.amountInvested} isShort />
              </TableCell>
              <TableCell className="text-right">
                <span className={cn('font-semibold', result.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                  {result.pnl >= 0 ? '+' : ''}
                  {result.pnl.toFixed(0)}
                </span>
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">
                <span className={cn('text-sm', result.returnPercent >= 0 ? 'text-success' : 'text-destructive')}>
                  {result.returnPercent >= 0 ? '+' : ''}
                  {result.returnPercent.toFixed(1)}%
                </span>
              </TableCell>
            </TableRow>
          </Link>
        ))}
      </TableBody>
    </Table>
  )
}

function ComparisonBar({
  label,
  userValue,
  platformValue,
  formatValue,
}: {
  label: string
  userValue: number
  platformValue: number
  formatValue: (v: number) => string
}) {
  const maxVal = Math.max(Math.abs(userValue), Math.abs(platformValue), 1)
  const userWidth = (Math.abs(userValue) / maxVal) * 100
  const platformWidth = (Math.abs(platformValue) / maxVal) * 100
  const userPositive = userValue >= platformValue

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-16 shrink-0 text-right text-xs text-muted-foreground">You</div>
          <div className="relative flex h-5 flex-1 items-center rounded bg-muted">
            <div
              className={cn('absolute h-full rounded opacity-80', userPositive ? 'bg-success' : 'bg-muted-foreground')}
              style={{ width: `${userWidth}%` }}
            />
            <span className="relative z-10 ml-2 text-xs font-semibold">{formatValue(userValue)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 shrink-0 text-right text-xs text-muted-foreground">Platform</div>
          <div className="relative flex h-5 flex-1 items-center rounded bg-muted">
            <div className="absolute h-full rounded bg-muted-foreground opacity-40" style={{ width: `${platformWidth}%` }} />
            <span className="relative z-10 ml-2 text-xs text-muted-foreground">{formatValue(platformValue)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function PortfolioAnalyticsTab({ userId }: { userId: string }) {
  let analytics: PortfolioAnalytics

  try {
    const { data } = await getUserPortfolioAnalytics({ userId })
    analytics = data
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart2Icon className="mb-3 size-10 text-muted-foreground/50" />
        <p className="text-sm font-semibold">Unable to load analytics</p>
        <p className="text-xs text-muted-foreground">There was an error loading the portfolio analytics data.</p>
      </div>
    )
  }

  const { summary, categoryBreakdown, largestWins, largestLosses, recentResults, platformComparison } = analytics

  const hasData = summary.marketsTraded > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart2Icon className="mb-3 size-10 text-muted-foreground/50" />
        <p className="text-sm font-semibold">No trading data yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Start trading in prediction markets to see your portfolio analytics here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="portfolio-analytics">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Total P&L"
          value={
            <span className={summary.totalPnl >= 0 ? 'text-success' : 'text-destructive'}>
              {summary.totalPnl >= 0 ? '+' : ''}
              <CurrencyDisplay value={summary.totalPnl} isShort />
            </span>
          }
          description={`Realized: ${summary.totalRealizedPnl.toFixed(0)} | Unrealized: ${summary.totalUnrealizedPnl.toFixed(0)}`}
          icon={TrendingUpIcon}
        />
        <StatCard
          title="Win Rate"
          value={`${summary.winRate.toFixed(1)}%`}
          description={`${summary.marketsResolved} resolved markets`}
          icon={TargetIcon}
          valueClassName={summary.winRate >= 50 ? 'text-success' : 'text-destructive'}
        />
        <StatCard
          title="Avg Return"
          value={`${summary.avgReturn >= 0 ? '+' : ''}${summary.avgReturn.toFixed(1)}%`}
          description="On invested amount"
          icon={BarChart2Icon}
          valueClassName={summary.avgReturn >= 0 ? 'text-success' : 'text-destructive'}
        />
        <StatCard
          title="Markets Traded"
          value={summary.marketsTraded}
          description={`${summary.marketsResolved} resolved`}
          icon={TrendingDownIcon}
        />
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">P&amp;L by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown categories={categoryBreakdown} />
        </CardContent>
      </Card>

      {/* Wins and Losses */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUpIcon className="size-4 text-success" />
              Largest Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MarketResultsTable results={largestWins} emptyMessage="No winning trades yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDownIcon className="size-4 text-destructive" />
              Largest Losses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MarketResultsTable results={largestLosses} emptyMessage="No losing trades yet." />
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      {recentResults.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Resolved Markets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MarketResultsTable results={recentResults} emptyMessage="No resolved markets yet." />
          </CardContent>
        </Card>
      ) : null}

      {/* Platform Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">vs. Platform Average</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ComparisonBar
            label="Win Rate"
            userValue={platformComparison.userWinRate}
            platformValue={platformComparison.platformAvgWinRate}
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
          <ComparisonBar
            label="Avg Return"
            userValue={platformComparison.userAvgReturn}
            platformValue={platformComparison.platformAvgReturn}
            formatValue={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
          />
          <ComparisonBar
            label="Trading Volume"
            userValue={platformComparison.userTradingVolume}
            platformValue={platformComparison.platformAvgTradingVolume}
            formatValue={(v) => `¤${v.toFixed(0)}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
