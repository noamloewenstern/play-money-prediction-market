'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'
import { MarketsInfiniteParams } from '@play-money/api-helpers/client/hooks'
import { InfiniteMarketList } from './InfiniteMarketList'
import { MarketFilterPanel } from './MarketFilterPanel'

export function QuestionsInfiniteContent({ emptyState }: { emptyState?: React.ReactNode }) {
  const searchParams = useSearchParams()

  const tagsParam = searchParams.get('tags')
    ? searchParams
        .get('tags')!
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : searchParams.get('tag')
      ? [searchParams.get('tag')!]
      : undefined

  const params: MarketsInfiniteParams = {
    status: searchParams.get('status') || undefined,
    sort: searchParams.get('sort') || undefined,
    tags: tagsParam,
    marketType: searchParams.get('marketType') || undefined,
    minTraders: searchParams.get('minTraders') ? Number(searchParams.get('minTraders')) : undefined,
    maxTraders: searchParams.get('maxTraders') ? Number(searchParams.get('maxTraders')) : undefined,
    minLiquidity: searchParams.get('minLiquidity') ? Number(searchParams.get('minLiquidity')) : undefined,
    maxLiquidity: searchParams.get('maxLiquidity') ? Number(searchParams.get('maxLiquidity')) : undefined,
    closeDateMin: searchParams.get('closeDateMin') || undefined,
    closeDateMax: searchParams.get('closeDateMax') || undefined,
    limit: 25,
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <MarketFilterPanel />
      <InfiniteMarketList params={params} emptyState={emptyState} />
    </div>
  )
}
