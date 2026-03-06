import { ArrowDownIcon, ArrowUpIcon, CoinsIcon, TrendingUpIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { getMarkets } from '@play-money/api-helpers/client'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { INITIAL_USER_BALANCE_PRIMARY } from '@play-money/finance/economy'
import { Button } from '@play-money/ui/button'
import { Card, CardContent } from '@play-money/ui/card'

export async function PortfolioEmptyState() {
  const trendingResult = await getMarkets({ limit: 5 }).catch(() => ({
    data: [],
    pageInfo: { hasNextPage: false, total: 0 },
  }))

  const trendingMarkets = trendingResult.data

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CoinsIcon className="size-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Welcome to your portfolio</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          You start with <CurrencyDisplay value={INITIAL_USER_BALANCE_PRIMARY} /> to trade on prediction markets. Buy
          shares in outcomes you believe in, and sell when the odds shift in your favor.
        </p>
      </div>

      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <ArrowUpIcon className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Buy shares</p>
              <p className="text-xs text-muted-foreground">
                Pick an outcome you think is likely. The lower the price, the higher your potential return.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-red-400/10">
              <ArrowDownIcon className="size-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Sell to lock in profit</p>
              <p className="text-xs text-muted-foreground">
                If the price rises after you buy, sell your shares for a profit before the market resolves.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Link href="/">
        <Button size="lg">
          <TrendingUpIcon className="mr-2 size-4" />
          Make Your First Prediction
        </Button>
      </Link>

      {trendingMarkets.length > 0 ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUpIcon className="size-3" />
            Trending markets
          </div>
          <div className="w-full divide-y rounded-xl border font-mono text-sm">
            {trendingMarkets.map((market) => {
              const mostLikelyOption = market.options.reduce((prev, current) =>
                (prev.probability || 0) > (current.probability || 0) ? prev : current
              )

              return (
                <Link
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                  href={`/questions/${market.id}/${market.slug}`}
                  key={market.id}
                >
                  <span className="mr-4 line-clamp-1">{market.question}</span>
                  {!market.canceledAt && !market.marketResolution ? (
                    <span className="flex-shrink-0 font-medium" style={{ color: mostLikelyOption.color }}>
                      {Math.round(mostLikelyOption.probability || 0)}%
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
