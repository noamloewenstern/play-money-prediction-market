'use client'

import { Maximize2Icon, SparklesIcon, MinusIcon, TagIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import useSWR from 'swr'
import { MarketProbabilityDetail } from '@play-money/markets/components/MarketProbabilityDetail'
import { QuickTradePopover } from '@play-money/markets/components/QuickTradePopover'
import { ExtendedMarket } from '@play-money/markets/types'
import { formatDistanceToNowShort } from '@play-money/ui'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Button } from '@play-money/ui/button'
import { Card } from '@play-money/ui/card'
import { useUser } from '@play-money/users/context/UserContext'
import { PaginatedResponse } from '@play-money/api-helpers'
import { MarketFeedSkeleton } from './MarketFeedSkeleton'

export function PersonalizedFeed() {
  const { user } = useUser()
  const { data } = useSWR<PaginatedResponse<ExtendedMarket>>(user ? '/v1/users/me/feed?limit=5' : null)
  const markets = data?.data

  if (!user) return null

  if (!data) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <h4 className="text-sm font-semibold">For You</h4>
          </div>
        </div>
        <MarketFeedSkeleton count={3} />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <h4 className="text-sm font-semibold">For You</h4>
        </div>

        {markets?.length ? (
          <Link href="/questions/following">
            <Button size="icon" variant="ghost">
              <Maximize2Icon className="size-4 text-muted-foreground" />
            </Button>
          </Link>
        ) : null}
      </div>

      {!markets?.length ? (
        <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <TagIcon className="size-5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Your personalized feed is empty</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Follow tags you&apos;re interested in and new markets with those tags will appear here automatically.
          </p>
          <Link href="/questions">
            <Button size="sm" variant="outline" className="mt-1">
              Browse Markets
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y text-sm">
          {markets.map((market) => (
            <div className="flex flex-col transition-colors hover:bg-muted/30 sm:flex-row" key={market.id}>
              <Link
                className="flex-[3] px-5 pb-1 pt-3 leading-relaxed visited:text-muted-foreground sm:py-3.5"
                href={`/questions/${market.id}/${market.slug}`}
              >
                <span className="line-clamp-2">{market.question}</span>
              </Link>

              <div className="flex flex-[2] items-center">
                {market.canceledAt ? (
                  <Link className="flex-1 px-4 py-2 sm:py-3.5" href={`/questions/${market.id}/${market.slug}`}>
                    <div className="text-muted-foreground">
                      <span className="font-semibold">Canceled</span>
                    </div>
                  </Link>
                ) : market.marketResolution ? (
                  <Link className="flex-1 px-4 py-2 sm:py-3.5" href={`/questions/${market.id}/${market.slug}`}>
                    <div className="text-muted-foreground">
                      <span className="font-semibold">Resolved</span> {market.marketResolution.resolution.name}
                    </div>
                  </Link>
                ) : (
                  <QuickTradePopover marketId={market.id} options={market.options}>
                    <button
                      type="button"
                      className="flex-1 cursor-pointer px-4 py-2 text-left transition-opacity hover:opacity-80 sm:py-3.5"
                      data-quick-trade
                    >
                      <MarketProbabilityDetail options={market.options} />
                    </button>
                  </QuickTradePopover>
                )}
                <div className="px-4 py-2 sm:py-3.5">
                  {market.user ? (
                    <Link href={`/${market.user.username}`}>
                      <UserAvatar size="sm" user={market.user} />
                    </Link>
                  ) : market.closeDate ? (
                    <div className="text-muted-foreground">{formatDistanceToNowShort(market.closeDate)}</div>
                  ) : (
                    <MinusIcon className="size-4 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
