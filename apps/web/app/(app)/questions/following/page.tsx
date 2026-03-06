'use client'

import Link from 'next/link'
import React from 'react'
import useSWR from 'swr'
import { unfollowTag } from '@play-money/api-helpers/client'
import { MY_FOLLOWED_TAGS_PATH, useMyFollowedTags } from '@play-money/api-helpers/client/hooks'
import { MarketList } from '@play-money/markets/components/MarketList'
import { ExtendedMarket } from '@play-money/markets/types'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { useUser } from '@play-money/users/context/UserContext'
import { PaginatedResponse } from '@play-money/api-helpers'

export default function FollowingPage() {
  const { user } = useUser()
  const { data: followedTagsData, mutate: mutateFollowedTags } = useMyFollowedTags({ skip: !user })
  const followedTags = followedTagsData?.data ?? []
  const { data: feedData } = useSWR<PaginatedResponse<ExtendedMarket>>(user ? '/v1/users/me/feed?limit=50' : null)
  const markets = feedData?.data ?? []

  const handleUnfollow = async (tag: string) => {
    await unfollowTag({ tag })
    void mutateFollowedTags()
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-screen-lg p-8 text-center">
        <p className="text-muted-foreground">Sign in to follow tags and see personalized content.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Following</h1>
        </div>

        {followedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {followedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                <Link href={`/questions/tagged/${tag}`}>{tag}</Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleUnfollow(tag)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are not following any tags yet. Browse{' '}
            <Link href="/questions" className="text-primary hover:underline">
              questions
            </Link>{' '}
            and follow tags you are interested in.
          </p>
        )}

        {markets.length > 0 ? (
          <MarketList markets={markets} />
        ) : followedTags.length > 0 ? (
          <p className="text-sm text-muted-foreground">No active markets found for your followed tags.</p>
        ) : null}
      </div>

      <div className="space-y-8 md:w-80" />
    </div>
  )
}
