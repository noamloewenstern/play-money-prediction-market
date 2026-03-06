import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@play-money/ui/card'
import { Skeleton } from '@play-money/ui/skeleton'
import { Separator } from '@play-money/ui/separator'

function ProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 bg-muted/50">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1.5 h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-3 text-sm md:pt-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="text-center" key={i}>
              <Skeleton className="mx-auto h-5 w-16" />
              <Skeleton className="mx-auto mt-1 h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 py-3 md:py-3">
        <Skeleton className="h-3 w-32" />
      </CardFooter>
    </Card>
  )
}

function TabContentSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="rounded-md px-2 py-2.5" key={i}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1.5 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function UserProfileLoading() {
  return (
    <main className="mx-auto flex flex-1 flex-col items-start gap-6 md:flex-row">
      <div className="w-full space-y-4 md:w-80">
        <ProfileCardSkeleton />
        <Card className="relative p-4">
          <Skeleton className="h-[200px] w-full rounded-md" />
        </Card>
      </div>

      <div className="w-full flex-1">
        <Skeleton className="mb-4 h-10 w-[400px]" />
        <div className="flex flex-col gap-4 md:flex-row">
          <TabContentSkeleton />
          <TabContentSkeleton />
        </div>
      </div>
    </main>
  )
}
