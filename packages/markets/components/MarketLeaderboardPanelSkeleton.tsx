import React from 'react'
import { Card, CardContent } from '@play-money/ui/card'
import { Skeleton } from '@play-money/ui/skeleton'

function LeaderboardRowSkeleton() {
  return (
    <li className="flex items-center gap-2 py-2">
      <Skeleton className="size-5 rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="ml-auto h-4 w-12" />
    </li>
  )
}

export function MarketLeaderboardPanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-3 md:py-4">
        <Skeleton className="mb-1 h-3 w-20" />
        <ul className="divide-y divide-muted">
          {Array.from({ length: rows }).map((_, i) => (
            <LeaderboardRowSkeleton key={i} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
