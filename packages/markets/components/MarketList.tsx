'use client'

import { MessageSquareIcon, UsersIcon, DiamondIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@play-money/ui/tooltip'
import { ExtendedMarket } from '../types'
import { QuickTradePopover } from './QuickTradePopover'

export function MarketList({
  markets,
  linkRef,
  emptyState,
}: {
  markets: Array<ExtendedMarket>
  linkRef?: string
  emptyState?: React.ReactNode
}) {
  const refParam = linkRef ? `?ref=${encodeURIComponent(linkRef)}` : ''

  if (markets.length === 0 && emptyState) {
    return <div className="flex-1">{emptyState}</div>
  }

  return (
    <div className="flex-1 space-y-4">
      {markets.map((market) => {
        const mostLikelyOption = market.options.reduce((prev, current) =>
          (prev.probability || 0) > (current.probability || 0) ? prev : current
        )

        return (
          <div className="rounded-lg border p-4 transition-colors hover:bg-muted/20" key={market.id}>
            <Link
              className="line-clamp-2 text-lg font-medium leading-relaxed visited:text-muted-foreground"
              href={`/questions/${market.id}/${market.slug}${refParam}`}
            >
              {market.question}
            </Link>

            <div className="mt-1 flex min-h-5 gap-4 text-sm text-muted-foreground">
              <div className="flex gap-2 overflow-hidden">
                {market.canceledAt ? (
                  <div className="text-muted-foreground">
                    <span className="font-semibold">Canceled</span>
                  </div>
                ) : market.marketResolution ? (
                  <div className="font-medium" style={{ color: market.marketResolution.resolution.color }}>
                    Resolved {market.marketResolution.resolution.name}
                  </div>
                ) : (
                  <QuickTradePopover marketId={market.id} options={market.options}>
                    <button
                      type="button"
                      className="flex-shrink-0 cursor-pointer rounded-md font-medium transition-opacity hover:opacity-80"
                      style={{ color: mostLikelyOption.color }}
                      data-quick-trade
                    >
                      {Math.round(mostLikelyOption.probability || 0)}% {mostLikelyOption.name}
                    </button>
                  </QuickTradePopover>
                )}
              </div>

              <div className="ml-auto flex flex-shrink-0 items-center gap-4">
                {market.commentCount ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1">
                        <MessageSquareIcon className="size-3" strokeWidth={3} />
                        {market.commentCount}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Comments</TooltipContent>
                  </Tooltip>
                ) : null}

                {market.uniqueTradersCount ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="size-3" strokeWidth={3} />
                        {market.uniqueTradersCount}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Traders</TooltipContent>
                  </Tooltip>
                ) : null}

                {market.liquidityCount ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-0">
                        <DiamondIcon className="size-3" strokeWidth={3} />
                        <CurrencyDisplay value={market.liquidityCount} isShort hasSymbol={false} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Liquidity</TooltipContent>
                  </Tooltip>
                ) : null}

                <Link href={`/${market.user.username}`}>
                  <UserAvatar user={market.user} size="sm" />
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
