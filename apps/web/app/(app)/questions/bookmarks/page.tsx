'use client'

import { Bookmark } from 'lucide-react'
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
      <div className="mx-auto max-w-screen-lg p-8 text-center">
        <p className="text-muted-foreground">Sign in to bookmark markets and build your watchlist.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
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
          <p className="text-sm text-muted-foreground">
            You have not bookmarked any markets yet. Browse{' '}
            <Link href="/questions" className="text-primary hover:underline">
              questions
            </Link>{' '}
            and bookmark markets you want to follow.
          </p>
        )}
      </div>

      <div className="space-y-8 md:w-80" />
    </div>
  )
}
