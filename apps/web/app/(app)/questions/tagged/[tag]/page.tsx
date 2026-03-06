import React from 'react'
import { getMarkets } from '@play-money/api-helpers/client'
import { MarketEmptyState } from '@play-money/markets/components/MarketEmptyState'
import { MarketList } from '@play-money/markets/components/MarketList'
import { TagFollowButton } from '@play-money/markets/components/TagFollowButton'

export default async function AppQuestionsPage({ params }: { params: { tag: string } }) {
  const { data: markets } = await getMarkets({ tags: [params.tag] })

  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="w-full">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{params.tag}</h1>
          <TagFollowButton tag={params.tag} />
        </div>
        <MarketList
          markets={markets}
          linkRef={`tag:${params.tag}`}
          emptyState={<MarketEmptyState tag={params.tag} />}
        />
      </div>

      <div className="space-y-8 md:w-80" />
    </div>
  )
}
