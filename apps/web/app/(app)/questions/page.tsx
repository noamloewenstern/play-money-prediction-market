import React from 'react'
import { MarketEmptyState } from '@play-money/markets/components/MarketEmptyState'
import { QuestionsInfiniteContent } from '@play-money/markets/components/QuestionsInfiniteContent'

type SearchParams = {
  tag?: string
}

export default async function AppQuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <QuestionsInfiniteContent emptyState={<MarketEmptyState tag={searchParams.tag} />} />
    </div>
  )
}
