import React from 'react'
import { Skeleton } from '@play-money/ui/skeleton'

function FeedRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row">
      <div className="flex-[3] px-5 pb-1 pt-3 sm:py-3.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
      </div>

      <div className="flex flex-[2] items-center">
        <div className="flex-1 px-4 py-2 sm:py-3.5">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="px-4 py-2 sm:py-3.5">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function MarketFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y text-sm">
      {Array.from({ length: count }).map((_, i) => (
        <FeedRowSkeleton key={i} />
      ))}
    </div>
  )
}
