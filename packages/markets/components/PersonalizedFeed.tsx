'use client'

import { Maximize2Icon, MinusIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import useSWR from 'swr'
import { MarketProbabilityDetail } from '@play-money/markets/components/MarketProbabilityDetail'
import { ExtendedMarket } from '@play-money/markets/types'
import { formatDistanceToNowShort } from '@play-money/ui'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Button } from '@play-money/ui/button'
import { Card } from '@play-money/ui/card'
import { useUser } from '@play-money/users/context/UserContext'
import { PaginatedResponse } from '@play-money/api-helpers'

export function PersonalizedFeed() {
  const { user } = useUser()
  const { data } = useSWR<PaginatedResponse<ExtendedMarket>>(user ? '/v1/users/me/feed?limit=5' : null)
  const markets = data?.data

  if (!user || !markets?.length) return null

  return (
    <Card>
      <div className="flex items-center justify-between rounded-t-lg border-b bg-muted pl-4 pr-2">
        <h4 className="py-3 text-lg font-semibold">For you</h4>

        <Link href="/questions/following">
          <Button size="icon" variant="ghost">
            <Maximize2Icon className="size-4 text-muted-foreground" />
          </Button>
        </Link>
      </div>

      <div className="divide-y font-mono text-sm">
        {markets.map((market) => (
          <div className="flex flex-col transition-colors hover:bg-muted/50 sm:flex-row" key={market.id}>
            <Link
              className="m-2 mb-0 ml-3 line-clamp-2 flex-[3] visited:text-muted-foreground sm:mb-2"
              href={`/questions/${market.id}/${market.slug}`}
            >
              {market.question}
            </Link>

            <div className="flex flex-[2]">
              <Link className="flex-1 p-2" href={`/questions/${market.id}/${market.slug}`}>
                {market.canceledAt ? (
                  <div className="text-muted-foreground">
                    <span className="font-semibold">Canceled</span>
                  </div>
                ) : market.marketResolution ? (
                  <div className="text-muted-foreground">
                    <span className="font-semibold">Resolved</span> {market.marketResolution.resolution.name}
                  </div>
                ) : (
                  <MarketProbabilityDetail options={market.options} />
                )}
              </Link>
              <div className="p-2 pr-3">
                {market.user ? (
                  <Link href={`/${market.user.username}`}>
                    <UserAvatar size="sm" user={market.user} />
                  </Link>
                ) : market.closeDate ? (
                  <div className="text-muted-foreground">{formatDistanceToNowShort(market.closeDate)}</div>
                ) : (
                  <MinusIcon className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
