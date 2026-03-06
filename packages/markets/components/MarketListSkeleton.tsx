import React from 'react'
import { Skeleton } from '@play-money/ui/skeleton'

function MarketCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-1.5 h-5 w-1/2" />

      <div className="mt-1 flex min-h-5 gap-4">
        <Skeleton className="h-4 w-20" />

        <div className="ml-auto flex flex-shrink-0 items-center gap-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function MarketListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex-1 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  )
}
