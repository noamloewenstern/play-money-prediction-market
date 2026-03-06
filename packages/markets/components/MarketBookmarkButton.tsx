'use client'

import { Bookmark } from 'lucide-react'
import React from 'react'
import { mutate } from 'swr'
import { bookmarkMarket, unbookmarkMarket } from '@play-money/api-helpers/client'
import { MARKET_BOOKMARK_PATH, MY_BOOKMARKS_PATH, useMarketBookmark } from '@play-money/api-helpers/client/hooks'
import { Button } from '@play-money/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@play-money/ui/tooltip'
import { toast } from '@play-money/ui/use-toast'
import { useUser } from '@play-money/users/context/UserContext'

export function MarketBookmarkButton({ marketId }: { marketId: string }) {
  const { user } = useUser()
  const { data, mutate: mutateBookmark } = useMarketBookmark({ marketId, skip: !user })
  const isBookmarked = data?.data?.isBookmarked ?? false

  const handleToggleBookmark = async () => {
    if (!user) return

    try {
      if (isBookmarked) {
        await unbookmarkMarket({ marketId })
      } else {
        await bookmarkMarket({ marketId })
      }
      void mutateBookmark()
      void mutate(MY_BOOKMARKS_PATH)
    } catch (error) {
      toast({
        title: 'There was an error updating your bookmark',
        description: (error as Error).message,
      })
    }
  }

  if (!user) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleToggleBookmark}>
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          <span className="sr-only">{isBookmarked ? 'Remove bookmark' : 'Bookmark'}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isBookmarked ? 'Remove bookmark' : 'Bookmark this market'}</TooltipContent>
    </Tooltip>
  )
}
