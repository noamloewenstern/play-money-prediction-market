'use client'

import React from 'react'
import { mutate } from 'swr'
import { followUser, unfollowUser } from '@play-money/api-helpers/client'
import { MY_FOLLOWERS_PATH, MY_FOLLOWING_PATH, USER_FOLLOW_PATH, useUserFollow } from '@play-money/api-helpers/client/hooks'
import { Button } from '@play-money/ui/button'
import { toast } from '@play-money/ui/use-toast'
import { useUser } from '../context/UserContext'

export function UserFollowButton({ userId }: { userId: string }) {
  const { user } = useUser()
  const { data, mutate: mutateFollow } = useUserFollow({ userId, skip: !user || user.id === userId })
  const isFollowing = data?.data?.isFollowing ?? false

  const handleToggleFollow = async () => {
    if (!user || user.id === userId) return

    try {
      if (isFollowing) {
        await unfollowUser({ userId })
      } else {
        await followUser({ userId })
      }
      void mutateFollow()
      void mutate(MY_FOLLOWING_PATH)
      void mutate(MY_FOLLOWERS_PATH)
    } catch (error) {
      toast({
        title: 'There was an error updating your follow',
        description: (error as Error).message,
      })
    }
  }

  if (!user || user.id === userId) return null

  return (
    <Button variant={isFollowing ? 'outline' : 'default'} size="sm" onClick={handleToggleFollow}>
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}
