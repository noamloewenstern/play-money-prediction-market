import React from 'react'
import { Skeleton } from '@play-money/ui/skeleton'

function LeaderboardCardSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-soft">
      <div className="border-b px-4 py-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-1 h-3 w-full" />
      </div>
      <ul className="divide-y divide-muted">
        {Array.from({ length: 10 }).map((_, i) => (
          <li className="flex items-center gap-2 px-4 py-2" key={i}>
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-12" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-screen-lg flex-1 gap-8 md:flex-row">
      <Skeleton className="mx-auto mb-8 h-8 w-56" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LeaderboardCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
