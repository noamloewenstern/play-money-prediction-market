import React from 'react'
import { Skeleton } from '@play-money/ui/skeleton'

function NotificationItemSkeleton() {
  return (
    <div className="flex min-w-0 gap-2 px-4 py-3">
      <div className="relative mt-1 flex-shrink-0">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex gap-2">
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-end gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-8 flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}

export function NotificationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  )
}
