import React from 'react'
import { MarketFeedSkeleton } from '@play-money/markets/components/MarketFeedSkeleton'
import { Skeleton } from '@play-money/ui/skeleton'
import { Card } from '@play-money/ui/card'

function SidebarActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="flex flex-row" key={i}>
          <div className="relative -ml-1 mr-2 flex w-6 items-center justify-center">
            <div className="relative -m-1 bg-background p-1">
              <Skeleton className="size-4 rounded-full" />
            </div>
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HomeLoading() {
  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        {['Closing Soon', 'Recent Lists', 'Recent Questions'].map((title) => (
          <Card className="overflow-hidden" key={title}>
            <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <MarketFeedSkeleton count={5} />
          </Card>
        ))}
      </div>

      <div className="space-y-6 md:w-80">
        <div>
          <Skeleton className="mb-3 h-3 w-16" />
          <SidebarActivitySkeleton />
        </div>
      </div>
    </div>
  )
}
