import React from 'react'
import { Card, CardContent, CardHeader } from '@play-money/ui/card'
import { Skeleton } from '@play-money/ui/skeleton'

export default function MarketDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-[400px]" />

        <Card className="flex-1">
          <CardHeader className="pt-0">
            <Skeleton className="mt-4 h-7 w-full" />
            <Skeleton className="h-7 w-2/3" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </CardHeader>

          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-md" />
          </CardContent>

          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </CardContent>

          <div className="mx-6 border-t" />

          <div className="px-6 pt-5">
            <Skeleton className="h-5 w-16" />
          </div>

          <div className="mt-3 space-y-4 px-6 pb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="flex gap-2" key={i}>
                <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-1 h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="w-full space-y-8 md:w-80">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="mt-3 h-10 w-full rounded-md" />
            <Skeleton className="mt-3 h-10 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
