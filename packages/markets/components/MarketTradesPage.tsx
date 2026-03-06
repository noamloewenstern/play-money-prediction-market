import { format, isPast } from 'date-fns'
import { ArrowRightLeftIcon, TrendingUpIcon } from 'lucide-react'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import React from 'react'
import { PageInfo } from '@play-money/api-helpers/types'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { TradesTable } from '@play-money/finance/components/TradesTable'
import { TransactionWithEntries } from '@play-money/finance/types'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Button } from '@play-money/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'
import { UserLink } from '@play-money/users/components/UserLink'
import { ExtendedMarket } from '../types'
import { MarketToolbar } from './MarketToolbar'

export function MarketTradesPage({
  market,
  transactions,
  pageInfo,
}: {
  market: ExtendedMarket
  transactions: Array<TransactionWithEntries>
  pageInfo: PageInfo
}) {
  const simplyIfTwoOptions = market.options.length === 2

  const mostLikelyOption = market.options.reduce((prev, current) =>
    (prev.probability || 0) > (current.probability || 0) ? prev : current
  )

  return (
    <Card className="flex-1">
      <MarketToolbar market={market} />

      <CardHeader className="pt-0 md:pt-0">
        <CardTitle className="leading-relaxed">{market.question}</CardTitle>
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground md:flex-nowrap">
          {!market.marketResolution ? (
            <div style={{ color: mostLikelyOption.color }} className="flex-shrink-0 font-medium">
              {Math.round(mostLikelyOption.probability || 0)}% {truncate(mostLikelyOption.name, { length: 30 })}
            </div>
          ) : null}
          {market.liquidityCount ? (
            <div className="flex-shrink-0">
              <CurrencyDisplay value={market.liquidityCount} isShort /> Vol.
            </div>
          ) : null}
          {market.closeDate ? (
            <div className="flex-shrink-0">
              {isPast(market.closeDate) ? 'Ended' : 'Ending'} {format(market.closeDate, 'MMM d, yyyy')}
            </div>
          ) : null}
          {market.user ? (
            <div className="flex items-center gap-1 truncate">
              <UserAvatar user={market.user} size="sm" />
              <UserLink user={market.user} hideUsername />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 border-t pt-3 md:pt-6">
        {transactions.length ? (
          <TradesTable data={transactions} pageInfo={pageInfo} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <ArrowRightLeftIcon className="size-5 text-primary" />
            </div>
            <p className="text-sm font-semibold">No trades yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Be the first to trade on this market. Buy shares in the outcome you think is most likely.
            </p>
            <Link href={`/questions/${market.id}/${market.slug}`}>
              <Button size="sm" className="mt-1">
                <TrendingUpIcon className="mr-1.5 size-3.5" />
                Make a Prediction
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
