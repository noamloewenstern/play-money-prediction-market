'use client'

import React from 'react'
import { mutate } from 'swr'
import { followTag, unfollowTag } from '@play-money/api-helpers/client'
import { MY_FOLLOWED_TAGS_PATH, TAG_FOLLOW_PATH, useTagFollow } from '@play-money/api-helpers/client/hooks'
import { Button } from '@play-money/ui/button'
import { toast } from '@play-money/ui/use-toast'
import { useUser } from '@play-money/users/context/UserContext'

export function TagFollowButton({ tag }: { tag: string }) {
  const { user } = useUser()
  const { data, mutate: mutateFollow } = useTagFollow({ tag, skip: !user })
  const isFollowing = data?.data?.isFollowing ?? false

  const handleToggleFollow = async () => {
    if (!user) return

    try {
      if (isFollowing) {
        await unfollowTag({ tag })
      } else {
        await followTag({ tag })
      }
      void mutateFollow()
      void mutate(MY_FOLLOWED_TAGS_PATH)
    } catch (error) {
      toast({
        title: 'There was an error updating your tag follow',
        description: (error as Error).message,
      })
    }
  }

  if (!user) return null

  return (
    <Button variant={isFollowing ? 'outline' : 'default'} size="sm" onClick={handleToggleFollow}>
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}
