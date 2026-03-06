import type { Metadata } from 'next'
import React from 'react'
import { getMarkets } from '@play-money/api-helpers/client'
import { MarketEmptyState } from '@play-money/markets/components/MarketEmptyState'
import { MarketList } from '@play-money/markets/components/MarketList'
import { TagFollowButton } from '@play-money/markets/components/TagFollowButton'
import { TagLeaderboard } from '@play-money/markets/components/TagLeaderboard'
import { TagStats } from '@play-money/markets/components/TagStats'

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const decodedTag = decodeURIComponent(params.tag)
  const title = `${decodedTag} — Prediction Markets on Play Money`
  const description = `Browse prediction markets tagged with "${decodedTag}" on Play Money. Forecast outcomes and track probabilities.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function AppQuestionsPage({ params }: { params: { tag: string } }) {
  const decodedTag = decodeURIComponent(params.tag)
  const { data: markets } = await getMarkets({ tags: [decodedTag] })

  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="w-full">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{decodedTag}</h1>
          <TagFollowButton tag={decodedTag} />
        </div>
        <MarketList
          markets={markets}
          linkRef={`tag:${decodedTag}`}
          emptyState={<MarketEmptyState tag={decodedTag} />}
        />
      </div>

      <div className="space-y-6 md:w-80">
        <TagStats tag={decodedTag} />
        <TagLeaderboard tag={decodedTag} />
      </div>
    </div>
  )
}
