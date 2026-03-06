import React from 'react'
import { MarketsTableSkeleton } from '@play-money/markets/components/MarketsTableSkeleton'

export default function QuestionsLoading() {
  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <MarketsTableSkeleton />
    </div>
  )
}
