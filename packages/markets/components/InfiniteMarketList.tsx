'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { MarketsInfiniteParams, useMarketsInfinite } from '@play-money/api-helpers/client/hooks'
import { Skeleton } from '@play-money/ui/skeleton'
import { MarketList } from './MarketList'

function MarketListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="mt-1.5 h-4 w-3/4" />
          <div className="mt-2 flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InfiniteMarketList({
  params,
  emptyState,
}: {
  params?: MarketsInfiniteParams
  emptyState?: React.ReactNode
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { data, size, setSize, isValidating } = useMarketsInfinite(params)

  const markets = data ? data.flatMap((page) => page.data) : []
  const hasMore = data ? (data[data.length - 1]?.pageInfo.hasNextPage ?? false) : false
  const isInitialLoading = !data

  const loadMore = useCallback(() => {
    if (!isValidating && hasMore) {
      void setSize(size + 1)
    }
  }, [isValidating, hasMore, setSize, size])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  if (isInitialLoading) {
    return <MarketListSkeleton />
  }

  return (
    <div className="flex flex-col gap-4">
      <MarketList markets={markets} emptyState={emptyState} />
      <div ref={sentinelRef} className="h-1" aria-hidden="true" data-testid="infinite-scroll-sentinel" />
      {isValidating && markets.length > 0 ? <MarketListSkeleton /> : null}
    </div>
  )
}
