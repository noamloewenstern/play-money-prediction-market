import { ListIcon, PlusCircleIcon, SearchIcon, UsersIcon, LockIcon, GlobeIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { getLists } from '@play-money/api-helpers/client'
import { Button } from '@play-money/ui/button'
import { Card, CardContent } from '@play-money/ui/card'

const EXAMPLE_LISTS = [
  {
    title: '2026 Elections',
    description: 'Track predictions on key races, ballot measures, and political outcomes worldwide.',
    tags: ['politics', 'elections'],
    policy: 'PUBLIC' as const,
  },
  {
    title: 'AI Milestones',
    description: 'Will GPT-5 launch this year? Will AI pass the bar exam? Bet on the future of AI.',
    tags: ['ai', 'technology'],
    policy: 'PUBLIC' as const,
  },
  {
    title: 'Sports Predictions',
    description: 'Championship winners, MVP races, and transfer rumors all in one place.',
    tags: ['sports', 'nba', 'soccer'],
    policy: 'OWNERS_ONLY' as const,
  },
]

const POLICY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  PUBLIC: { label: 'Open contributions', icon: <GlobeIcon className="size-3" /> },
  OWNERS_ONLY: { label: 'Owner only', icon: <LockIcon className="size-3" /> },
}

export async function ListsEmptyState() {
  const popularListsResult = await getLists({ limit: 3 }).catch(() => ({
    data: [],
    pageInfo: { hasNextPage: false, total: 0 },
  }))

  const popularLists = popularListsResult.data

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <ListIcon className="size-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Discover and create lists</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Lists group related prediction markets together. Curate a collection around a theme, or browse lists created
          by the community.
        </p>
      </div>

      <div className="grid w-full max-w-lg gap-3">
        {EXAMPLE_LISTS.map((example) => {
          const policy = POLICY_LABELS[example.policy]
          return (
            <Card key={example.title} className="transition-colors hover:bg-muted/30">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ListIcon className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{example.title}</p>
                  <p className="text-xs text-muted-foreground">{example.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {example.tags.map((tag) => (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground" key={tag}>
                        {tag}
                      </span>
                    ))}
                    {policy ? (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {policy.icon} {policy.label}
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button variant="outline">
            <SearchIcon className="mr-2 size-4" />
            Browse Popular Lists
          </Button>
        </Link>
        <Link href="/create-post">
          <Button>
            <PlusCircleIcon className="mr-2 size-4" />
            Create Your Own List
          </Button>
        </Link>
      </div>

      <div className="flex w-full max-w-lg flex-col items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <UsersIcon className="size-3" />
          Contribution Policies
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-lg border p-3">
            <GlobeIcon className="mt-0.5 size-3.5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">Public</p>
              <p className="text-[11px] text-muted-foreground">Anyone can add markets to the list</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border p-3">
            <LockIcon className="mt-0.5 size-3.5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">Owner only</p>
              <p className="text-[11px] text-muted-foreground">Only the creator can add markets</p>
            </div>
          </div>
        </div>
      </div>

      {popularLists.length > 0 ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ListIcon className="size-3" />
            Popular Lists
          </div>
          <div className="w-full divide-y rounded-xl border text-sm">
            {popularLists.map((list) => (
              <Link
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                href={`/lists/${list.id}/${list.slug}`}
                key={list.id}
              >
                <div className="mr-4 flex-1">
                  <span className="line-clamp-1 font-medium">{list.title}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {list.markets.length} {list.markets.length === 1 ? 'market' : 'markets'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
