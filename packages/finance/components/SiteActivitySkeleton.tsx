import React from 'react'
import { Skeleton } from '@play-money/ui/skeleton'

function ActivityItemSkeleton({ isFirst, isLast }: { isFirst: boolean; isLast: boolean }) {
  return (
    <div className="flex flex-row">
      <div className="relative -ml-1 mr-2 flex w-6 items-center justify-center">
        {!isLast ? (
          <div className="absolute -bottom-4 left-0 top-1/2 flex w-6 justify-center">
            <div className="w-px bg-border" />
          </div>
        ) : null}
        {!isFirst ? (
          <div className="absolute -top-4 bottom-1/2 left-0 flex w-6 justify-center">
            <div className="w-px bg-border" />
          </div>
        ) : null}

        <div className="relative -m-1 bg-background p-1">
          <Skeleton className="size-4 rounded-full" />
        </div>
      </div>
      <div className="flex-1">
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}

export function SiteActivitySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ActivityItemSkeleton key={i} isFirst={i === 0} isLast={i === count - 1} />
      ))}
    </div>
  )
}
