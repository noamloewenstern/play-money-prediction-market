'use client'

import React, { useState } from 'react'
import { Button } from '@play-money/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@play-money/ui/sheet'
import { isMarketTradable, isMarketCanceled, isMarketResolved } from '../rules'
import { ExtendedMarket } from '../types'
import { MarketTradePanel } from './MarketTradePanel'

export function MobileTradeBar({
  market,
  onTradeComplete,
}: {
  market: ExtendedMarket
  onTradeComplete: () => void
}) {
  const [open, setOpen] = useState(false)

  const isTradable = isMarketTradable({ market })
  const isResolved = isMarketResolved({ market })
  const isCanceled = isMarketCanceled({ market })

  if (isCanceled) return null

  const mostLikelyOption = market.options.reduce((prev, current) =>
    (prev.probability || 0) > (current.probability || 0) ? prev : current
  )

  const handleTradeComplete = () => {
    onTradeComplete()
    setOpen(false)
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            {!isResolved && isTradable ? (
              <span className="text-sm font-medium" style={{ color: mostLikelyOption.color }}>
                {Math.round(mostLikelyOption.probability || 0)}% {mostLikelyOption.name}
              </span>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {isResolved ? 'Resolved' : 'Trading closed'}
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => setOpen(true)} data-testid="mobile-trade-button">
            {isTradable ? 'Trade' : isResolved ? 'View Result' : 'View'}
          </Button>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the fixed bar */}
      <div className="h-16 md:hidden" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl px-4 pb-8">
          <SheetTitle className="sr-only">Trade Panel</SheetTitle>
          <MarketTradePanel
            market={market}
            isTradable={isTradable}
            isResolved={isResolved}
            isCanceled={isCanceled}
            onTradeComplete={handleTradeComplete}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
