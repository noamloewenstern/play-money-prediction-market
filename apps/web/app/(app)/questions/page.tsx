import React from 'react'
import { getMarkets } from '@play-money/api-helpers/client'
import { MarketEmptyState } from '@play-money/markets/components/MarketEmptyState'
import { MarketsTable } from '@play-money/markets/components/MarketsTable'

type SearchParams = {
  limit?: string
  cursor?: string
  sort?: string
  status?: string
  tag?: string
  tags?: string
  marketType?: string
  minTraders?: string
  maxTraders?: string
  minLiquidity?: string
  maxLiquidity?: string
  closeDateMin?: string
  closeDateMax?: string
}

export default async function AppQuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  const tagsParam = searchParams.tags
    ? searchParams.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : searchParams.tag
      ? [searchParams.tag]
      : undefined

  const { data: markets, pageInfo } = await getMarkets({
    limit: searchParams.limit ? Number(searchParams.limit) : undefined,
    cursor: searchParams.cursor,
    sortField: searchParams.sort?.split('-')[0],
    sortDirection: searchParams.sort?.split('-')[1] as 'asc' | 'desc',
    status: searchParams.status,
    tags: tagsParam,
    marketType: searchParams.marketType,
    minTraders: searchParams.minTraders ? Number(searchParams.minTraders) : undefined,
    maxTraders: searchParams.maxTraders ? Number(searchParams.maxTraders) : undefined,
    minLiquidity: searchParams.minLiquidity ? Number(searchParams.minLiquidity) : undefined,
    maxLiquidity: searchParams.maxLiquidity ? Number(searchParams.maxLiquidity) : undefined,
    closeDateMin: searchParams.closeDateMin,
    closeDateMax: searchParams.closeDateMax,
  })

  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <MarketsTable
        data={markets}
        pageInfo={pageInfo}
        emptyState={<MarketEmptyState tag={searchParams.tag} />}
      />
    </div>
  )
}
