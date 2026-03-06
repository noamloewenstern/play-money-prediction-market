'use client'

import { ClockIcon, HashIcon, MessageSquareIcon, PlusCircleIcon, SearchIcon, TagIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { getPopularTags, getSearch } from '@play-money/api-helpers/client'
import type { CommentSearchResult } from '@play-money/api-helpers/client'
import { List, Market, User } from '@play-money/database'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@play-money/ui/command'
import { DialogDescription, DialogTitle } from '@play-money/ui/dialog'

const RECENT_SEARCHES_KEY = 'play-money-recent-searches'
const MAX_RECENT_SEARCHES = 5

type RecentSearch = {
  query: string
  timestamp: number
}

function getRecentSearches(): Array<RecentSearch> {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!stored) return []
    return JSON.parse(stored) as Array<RecentSearch>
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return
  try {
    const existing = getRecentSearches().filter((s) => s.query !== trimmed)
    const updated = [{ query: trimmed, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // localStorage unavailable
  }
}

function removeRecentSearch(query: string) {
  try {
    const existing = getRecentSearches().filter((s) => s.query !== query)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(existing))
  } catch {
    // localStorage unavailable
  }
}

type SearchResultData = {
  users: Array<User>
  markets: Array<Market>
  lists: Array<List>
  tags: Array<{ tag: string; count: number }>
  comments: Array<CommentSearchResult>
}

function hasResults(results: SearchResultData | null): boolean {
  if (!results) return false
  return (
    results.markets.length > 0 ||
    results.lists.length > 0 ||
    results.users.length > 0 ||
    results.tags.length > 0 ||
    results.comments.length > 0
  )
}

function getCommentUrl(comment: CommentSearchResult): string {
  if (comment.entityType === 'MARKET') {
    return `/questions/${comment.entityId}/${comment.entitySlug}#${comment.id}`
  }
  return `/lists/${comment.entityId}/${comment.entitySlug}#${comment.id}`
}

function truncateContent(content: string, maxLength = 120): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trim() + '...'
}

export function GlobalSearchMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResultData | null>(null)
  const [popularTags, setPopularTags] = useState<Array<{ tag: string; count: number }>>([])
  const [recentSearches, setRecentSearches] = useState<Array<RecentSearch>>([])
  const [isLoading, setIsLoading] = useState(false)

  // Debounce the query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch search results
  useEffect(() => {
    if (!open) return

    let cancelled = false
    async function doSearch() {
      setIsLoading(true)
      try {
        const { data } = await getSearch({ query: debouncedQuery })
        if (!cancelled) {
          setResults(data)
        }
      } catch {
        // ignore errors
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    doSearch()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open])

  // Load popular tags and recent searches when opening
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches())

      async function fetchTags() {
        const { data } = await getPopularTags({ limit: 12 })
        setPopularTags(data)
      }
      fetchTags()
    } else {
      // Reset when closing
      setQuery('')
      setDebouncedQuery('')
      setResults(null)
    }
  }, [open])

  const navigateAndClose = useCallback(
    (path: string) => {
      if (query.trim()) {
        addRecentSearch(query)
      }
      router.push(path)
      onOpenChange(false)
    },
    [router, onOpenChange, query]
  )

  const handleRemoveRecent = useCallback((e: React.MouseEvent, searchQuery: string) => {
    e.stopPropagation()
    removeRecentSearch(searchQuery)
    setRecentSearches(getRecentSearches())
  }, [])

  const showRecentSearches = !query && recentSearches.length > 0

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} commandProps={{ shouldFilter: false }}>
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription className="sr-only">Search for markets, users, tags, and lists</DialogDescription>
      <CommandInput
        placeholder="Search markets, users, tags..."
        value={query}
        onInput={(event) => {
          setQuery(event.currentTarget.value)
        }}
      />
      <CommandList>
        {/* Recent searches - shown when no query */}
        {showRecentSearches ? (
          <CommandGroup heading="Recent searches">
            {recentSearches.map((recent) => (
              <CommandItem
                key={recent.query}
                value={`recent-${recent.query}`}
                className="flex flex-row items-center gap-2"
                onSelect={() => {
                  setQuery(recent.query)
                }}
              >
                <ClockIcon className="size-4 text-muted-foreground" />
                <span className="flex-1">{recent.query}</span>
                <button
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => handleRemoveRecent(e, recent.query)}
                  type="button"
                  aria-label={`Remove "${recent.query}" from recent searches`}
                >
                  <XIcon className="size-3" />
                </button>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {/* Empty state */}
        {query && !isLoading && !hasResults(results) ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-4 px-4 py-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <SearchIcon className="size-4 text-primary" />
                </div>
                <p className="text-sm font-semibold">{`No results for "${query}"`}</p>
              </div>

              <div className="flex w-full flex-col items-center gap-2 border-t pt-4">
                <p className="text-xs text-muted-foreground">Can&apos;t find what you&apos;re looking for?</p>
                <button
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  onClick={() => navigateAndClose(`/create-post?question=${encodeURIComponent(query)}`)}
                  type="button"
                >
                  <PlusCircleIcon className="size-4" />
                  Create a market about this
                </button>
              </div>
            </div>
          </CommandEmpty>
        ) : null}

        {/* No query empty state with trending topics */}
        {!query && !showRecentSearches && !hasResults(results) ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-4 px-4 py-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <SearchIcon className="size-4 text-primary" />
                </div>
                <p className="text-sm font-semibold">No results found</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Try searching for a market, user, tag, or list.
                </p>
              </div>

              {popularTags.length > 0 ? (
                <div className="flex w-full flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <TagIcon className="size-3" />
                    Trending topics
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {popularTags.map(({ tag, count }) => (
                      <button
                        className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                        key={tag}
                        onClick={() => navigateAndClose(`/questions/tagged/${encodeURIComponent(tag)}`)}
                        title={`${count} market${count !== 1 ? 's' : ''}`}
                        type="button"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CommandEmpty>
        ) : null}

        {/* Tags results */}
        {results?.tags.length ? (
          <CommandGroup heading="Tags">
            {results.tags.map(({ tag, count }) => (
              <CommandItem
                key={tag}
                value={`tag-${tag}`}
                className="flex flex-row items-center gap-2"
                onSelect={() => navigateAndClose(`/questions/tagged/${encodeURIComponent(tag)}`)}
              >
                <HashIcon className="size-4 text-muted-foreground" />
                <div className="font-semibold">{tag}</div>
                <div className="text-xs text-muted-foreground">
                  {count} market{count !== 1 ? 's' : ''}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {/* Markets results */}
        {results?.markets.length ? (
          <CommandGroup heading="Questions">
            {results.markets.map((market) => (
              <CommandItem
                key={market.id}
                value={market.id}
                className="flex flex-row gap-2"
                onSelect={() => navigateAndClose(`/questions/${market.id}/${market.slug}`)}
              >
                <div className="line-clamp-2 font-semibold">{market.question}</div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {/* Lists results */}
        {results?.lists.length ? (
          <CommandGroup heading="Lists">
            {results.lists.map((list) => (
              <CommandItem
                key={list.id}
                value={list.id}
                className="flex flex-row gap-2"
                onSelect={() => navigateAndClose(`/lists/${list.id}/${list.slug}`)}
              >
                <div className="line-clamp-2 font-semibold">{list.title}</div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {/* Users results */}
        {results?.users.length ? (
          <CommandGroup heading="Users">
            {results.users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.id}
                className="flex flex-row gap-2"
                onSelect={() => navigateAndClose(`/${user.username}`)}
              >
                <UserAvatar user={user} size="sm" />
                <div className="font-semibold">{user.displayName}</div>
                <div className="text-muted-foreground">@{user.username}</div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {/* Comments results */}
        {results?.comments.length ? (
          <CommandGroup heading="Comments">
            {results.comments.map((comment) => (
              <CommandItem
                key={comment.id}
                value={`comment-${comment.id}`}
                className="flex flex-row items-start gap-2"
                onSelect={() => navigateAndClose(getCommentUrl(comment))}
              >
                <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="line-clamp-2 text-sm">{truncateContent(comment.content)}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-medium">{comment.authorDisplayName}</span>
                    <span>in</span>
                    <span className="truncate font-medium">{comment.entityTitle}</span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {/* Trending topics footer when query has results */}
        {query && hasResults(results) && popularTags.length > 0 ? (
          <>
            <CommandSeparator />
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TagIcon className="size-3" />
                Trending
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.slice(0, 6).map(({ tag }) => (
                  <button
                    className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                    key={tag}
                    onClick={() => navigateAndClose(`/questions/tagged/${encodeURIComponent(tag)}`)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
