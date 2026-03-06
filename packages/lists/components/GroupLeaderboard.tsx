'use client'

import { EllipsisIcon } from 'lucide-react'
import React from 'react'
import { GROUP_LEADERBOARD_PATH, useGroupLeaderboard } from '@play-money/api-helpers/client/hooks'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import type { LeaderboardUser } from '@play-money/finance/types'
import { Badge } from '@play-money/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'
import { cn } from '@play-money/ui/utils'
import { UserLink } from '@play-money/users/components/UserLink'

function LeaderboardRow({
  leaderboardUser,
  index,
  isCurrentUser,
}: {
  leaderboardUser: LeaderboardUser
  index: number
  isCurrentUser?: boolean
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 px-4 py-2 even:bg-muted/50',
        isCurrentUser && 'bg-primary/10 ring-2 ring-inset ring-primary'
      )}
    >
      <Badge
        className={cn(
          'size-5 justify-center p-0',
          index === 0 && 'bg-[#FFD700]',
          index === 1 && 'bg-[#C0C0C0]',
          index === 2 && 'bg-[#CD7F32]'
        )}
        variant={index > 2 ? 'outline' : 'black'}
      >
        {index + 1}
      </Badge>
      <UserLink
        className="truncate text-sm"
        hideUsername
        user={{ ...leaderboardUser, id: leaderboardUser.userId }}
      />
      <span className="ml-auto tabular-nums text-sm text-muted-foreground">
        <CurrencyDisplay isShort value={leaderboardUser.total} />
      </span>
    </li>
  )
}

export function GroupLeaderboard({ listId, currentUserId }: { listId: string; currentUserId?: string }) {
  const { data, isLoading } = useGroupLeaderboard({ listId })

  const traders = data?.data?.traders ?? []
  const currentUserRank = currentUserId ? traders.find((t) => t.userId === currentUserId) : undefined
  const top10 = traders.slice(0, 10)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (traders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No trading activity yet. Start trading on the group markets to appear on the leaderboard.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Group Leaderboard</CardTitle>
        <p className="text-xs text-muted-foreground">Ranked by net profit on markets in this group</p>
      </CardHeader>
      <ul className="divide-y divide-muted">
        {top10.map((leaderboardUser, i) => (
          <LeaderboardRow
            key={leaderboardUser.userId}
            leaderboardUser={leaderboardUser}
            index={i}
            isCurrentUser={leaderboardUser.userId === currentUserId}
          />
        ))}

        {currentUserRank && currentUserRank.rank > 10 ? (
          <>
            <li className="flex items-center gap-2 px-4 py-1 text-sm">
              <EllipsisIcon className="size-3 text-muted-foreground" />
            </li>
            <LeaderboardRow
              leaderboardUser={currentUserRank}
              index={currentUserRank.rank - 1}
              isCurrentUser={true}
            />
          </>
        ) : null}
      </ul>
    </Card>
  )
}
