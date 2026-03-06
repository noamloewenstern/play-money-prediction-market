'use client'

import Link from 'next/link'
import React from 'react'
import { User } from '@play-money/database'
import { cn } from '@play-money/ui/utils'
import { UserHoverCard } from './UserHoverCard'

export function UserLink({
  user,
  hideUsername = false,
  className,
}: {
  user: Pick<User, 'username' | 'displayName' | 'id'> & { avatarUrl?: string | null }
  hideUsername?: boolean
  className?: string
}) {
  return (
    <UserHoverCard user={user}>
      <Link href={`/${user.username}`} className={cn('space-x-1 hover:underline', className)}>
        <span className="font-medium">{user.displayName}</span>
        {!hideUsername && <span className="text-muted-foreground">@{user.username}</span>}
      </Link>
    </UserHoverCard>
  )
}
