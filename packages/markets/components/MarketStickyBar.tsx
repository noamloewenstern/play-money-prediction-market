'use client'

import truncate from 'lodash/truncate'
import { ArrowUp } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@play-money/ui/button'
import { ExtendedMarket } from '../types'

export function MarketStickyBar({ market }: { market: ExtendedMarket }) {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const mostLikelyOption = market.options.reduce((prev, current) =>
    (prev.probability || 0) > (current.probability || 0) ? prev : current
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const handleScrollToTop = () => {
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      {visible ? (
        <div className="sticky top-16 z-30 -mx-px border-b bg-background/95 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="truncate text-sm font-semibold">{truncate(market.question, { length: 60 })}</span>
              {!market.marketResolution && !market.canceledAt ? (
                <span
                  style={{ color: mostLikelyOption.color }}
                  className="flex-shrink-0 text-sm font-medium"
                >
                  {Math.round(mostLikelyOption.probability || 0)}% {truncate(mostLikelyOption.name, { length: 20 })}
                </span>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" className="flex-shrink-0 gap-1" onClick={handleScrollToTop}>
              <ArrowUp className="h-3 w-3" />
              Back to Market
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
