'use client'

import { Droplets, ArrowRight } from 'lucide-react'
import React, { useState } from 'react'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import {
  DAILY_LIQUIDITY_BONUS_PRIMARY,
  LIQUIDITY_VOLUME_BONUS_PERCENT,
  UNIQUE_TRADER_BONUS_PRIMARY,
} from '@play-money/finance/economy'
import { Spotlight, useSpotlight } from '@play-money/ui/Spotlight'
import { Alert, AlertDescription, AlertTitle } from '@play-money/ui/alert'
import { Button } from '@play-money/ui/button'
import { cn } from '@play-money/ui/utils'

const TRADE_PRESETS = [10, 50, 100]

export function LowLiquidityBanner({ onClick }: { onClick: () => void }) {
  const { mouseX, mouseY, handleMouseMove, classNames } = useSpotlight()
  const [selectedTrades, setSelectedTrades] = useState(TRADE_PRESETS[0])

  const estimatedEarnings = Math.round(selectedTrades * UNIQUE_TRADER_BONUS_PRIMARY * LIQUIDITY_VOLUME_BONUS_PERCENT)
  const totalWithBonus = DAILY_LIQUIDITY_BONUS_PRIMARY + estimatedEarnings

  return (
    <Alert
      className={cn('border-warning/50 bg-warning/5 [&>svg]:text-warning', classNames)}
      onMouseMove={handleMouseMove}
    >
      <Droplets className="h-4 w-4" />
      <AlertTitle>This market needs liquidity</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-muted-foreground">
          Add liquidity to earn a <CurrencyDisplay value={DAILY_LIQUIDITY_BONUS_PRIMARY} /> daily bonus plus a{' '}
          {LIQUIDITY_VOLUME_BONUS_PERCENT * 100}% share of trading volume.
        </p>

        <div className="rounded-md border border-warning/20 bg-surface p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            If this market gets{' '}
            <span className="inline-flex gap-1">
              {TRADE_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTrades(n)
                  }}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-semibold transition-colors',
                    selectedTrades === n
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-warning/10 text-warning hover:bg-warning/20'
                  )}
                >
                  {n}
                </button>
              ))}
            </span>{' '}
            trades:
          </p>
          <p className="text-sm font-semibold text-foreground">
            Your liquidity could earn up to <CurrencyDisplay value={totalWithBonus} className="text-warning" />
          </p>
        </div>

        <Button variant="link" className="h-auto p-0 text-warning underline" onClick={onClick}>
          Add Liquidity Boost
          <ArrowRight className="h-4 w-4" />
        </Button>
      </AlertDescription>

      <Spotlight mouseX={mouseX} mouseY={mouseY} color="purple" />
    </Alert>
  )
}
