'use client'

import { TrendingUp, BarChart2, Trophy } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import useSWR from 'swr'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@play-money/ui/hover-card'
import { Separator } from '@play-money/ui/separator'
import { Skeleton } from '@play-money/ui/skeleton'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { UserBadgesDisplay } from './UserBadgesDisplay'
import { UserFollowButton } from './UserFollowButton'

type UserHoverCardUser = {
  id: string
  username: string
  displayName: string
  avatarUrl?: string | null
}

type HoverStats = {
  netWorth: number
  tradingVolume: number
  totalMarkets: number
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

function UserHoverCardContent({ user }: { user: UserHoverCardUser }) {
  const { data: statsData, isLoading: statsLoading } = useSWR<{ data: HoverStats }>(
    `/v1/users/${user.id}/stats`
  )

  const stats = statsData?.data

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Link href={`/${user.username}`}>
          <UserAvatar user={user} className="h-12 w-12" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/${user.username}`} className="hover:underline">
            <p className="font-semibold truncate">{user.displayName}</p>
          </Link>
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
        </div>
        <UserFollowButton userId={user.id} />
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-xs">Net Worth</span>
          </div>
          {statsLoading ? (
            <Skeleton className="h-5 w-12 mx-auto" />
          ) : (
            <p className="text-sm font-medium">{stats ? formatCurrency(stats.netWorth) : '—'}</p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <BarChart2 className="h-3.5 w-3.5" />
            <span className="text-xs">Volume</span>
          </div>
          {statsLoading ? (
            <Skeleton className="h-5 w-12 mx-auto" />
          ) : (
            <p className="text-sm font-medium">
              {stats ? formatCurrency(stats.tradingVolume) : '—'}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            <span className="text-xs">Markets</span>
          </div>
          {statsLoading ? (
            <Skeleton className="h-5 w-12 mx-auto" />
          ) : (
            <p className="text-sm font-medium">{stats?.totalMarkets ?? '—'}</p>
          )}
        </div>
      </div>

      <UserBadgesDisplay userId={user.id} showUnearned={false} maxBadges={6} />
    </div>
  )
}

export function UserHoverCard({
  user,
  children,
}: {
  user: UserHoverCardUser
  children: React.ReactNode
}) {
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" data-testid="user-hover-card">
        <UserHoverCardContent user={user} />
      </HoverCardContent>
    </HoverCard>
  )
}
