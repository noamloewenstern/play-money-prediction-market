'use client'

import { BookmarkIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { mutate } from 'swr'
import { unbookmarkMarket } from '@play-money/api-helpers/client'
import { MARKET_BOOKMARK_PATH, MY_BOOKMARKS_PATH, useMyBookmarks } from '@play-money/api-helpers/client/hooks'
import { MarketList } from '@play-money/markets/components/MarketList'
import { Button } from '@play-money/ui/button'
import { useUser } from '@play-money/users/context/UserContext'

export default function BookmarksPage() {
  const { user } = useUser()
  const { data: bookmarksData, mutate: mutateBookmarks } = useMyBookmarks({ skip: !user })
  const bookmarks = bookmarksData?.data ?? []
  const markets = bookmarks.map((b) => b.market)

  const handleRemoveBookmark = async (marketId: string) => {
    await unbookmarkMarket({ marketId })
    void mutateBookmarks()
    void mutate(MARKET_BOOKMARK_PATH(marketId))
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-screen-lg flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <BookmarkIcon className="size-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Sign in to bookmark markets</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Save markets you want to track and build your personal watchlist.
        </p>
        <Link href="/login">
          <Button className="mt-1">Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Bookmarks</h1>
        </div>

        {markets.length > 0 ? (
          <div className="space-y-4">
            <MarketList markets={markets} />
            <div className="flex flex-wrap gap-2">
              {bookmarks.map((bookmark) => (
                <Button
                  key={bookmark.id}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => handleRemoveBookmark(bookmark.marketId)}
                >
                  Remove bookmark for {bookmark.market.question.slice(0, 40)}
                  {bookmark.market.question.length > 40 ? '...' : ''}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <BookmarkIcon className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No bookmarks yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Bookmark markets you want to keep an eye on. Click the bookmark icon on any market to save it here for quick
              access.
            </p>
            <Link href="/questions">
              <Button className="mt-1">
                <SearchIcon className="mr-2 size-4" />
                Browse Markets
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-8 md:w-80" />
    </div>
  )
}
