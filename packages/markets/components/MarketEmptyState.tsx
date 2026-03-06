import { SearchIcon, PlusCircleIcon, TagIcon, TrendingUpIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { getMarkets, getPopularTags } from '@play-money/api-helpers/client'
import { Button } from '@play-money/ui/button'

type MarketEmptyStateProps = {
  searchQuery?: string
  tag?: string
}

export async function MarketEmptyState({ searchQuery, tag }: MarketEmptyStateProps) {
  const [popularTagsResult, popularMarketsResult] = await Promise.all([
    getPopularTags({ excludeTag: tag, limit: 8 }).catch(() => ({ data: [] })),
    getMarkets({ limit: 5 }).catch(() => ({ data: [], pageInfo: { hasNextPage: false, total: 0 } })),
  ])

  const popularTags = popularTagsResult.data
  const popularMarkets = popularMarketsResult.data

  const createUrl = searchQuery
    ? `/create-post?question=${encodeURIComponent(searchQuery)}`
    : tag
      ? `/create-post?tags=${encodeURIComponent(tag)}`
      : '/create-post'

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <SearchIcon className="size-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">No markets found</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          {tag
            ? `There are no markets tagged "${tag}" yet.`
            : searchQuery
              ? `No markets match "${searchQuery}".`
              : 'There are no markets matching your filters.'}
        </p>
      </div>

      <Link href={createUrl}>
        <Button>
          <PlusCircleIcon className="mr-2 size-4" />
          Create a market{tag ? ` about ${tag}` : searchQuery ? ' about this topic' : ''}
        </Button>
      </Link>

      {popularTags.length > 0 ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TagIcon className="size-3" />
            Popular tags
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map(({ tag: t }) => (
              <Link
                className="rounded-full border bg-muted/50 px-3 py-1 text-sm transition-colors hover:bg-muted"
                href={`/questions/tagged/${encodeURIComponent(t)}`}
                key={t}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {popularMarkets.length > 0 ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUpIcon className="size-3" />
            Popular markets
          </div>
          <div className="w-full divide-y rounded-xl border text-sm">
            {popularMarkets.map((market) => {
              const mostLikelyOption = market.options.reduce((prev, current) =>
                (prev.probability || 0) > (current.probability || 0) ? prev : current
              )

              return (
                <Link
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                  href={`/questions/${market.id}/${market.slug}`}
                  key={market.id}
                >
                  <span className="mr-4 line-clamp-1">{market.question}</span>
                  {!market.canceledAt && !market.marketResolution ? (
                    <span className="flex-shrink-0 tabular-nums font-semibold" style={{ color: mostLikelyOption.color }}>
                      {Math.round(mostLikelyOption.probability || 0)}%
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
