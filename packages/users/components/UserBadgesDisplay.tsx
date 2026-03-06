'use client'

import {
  ArrowRightLeft,
  BarChart2,
  Crown,
  Droplets,
  Layers,
  MessageSquare,
  PlusCircle,
  Star,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import React from 'react'
import { type UserBadge } from '@play-money/api-helpers/client'
import { useUserBadges } from '@play-money/api-helpers/client/hooks'
import { Skeleton } from '@play-money/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@play-money/ui/tooltip'
import { cn } from '@play-money/ui/utils'

type BadgeIconConfig = {
  icon: React.ComponentType<{ className?: string }>
  earnedColor: string
}

const BADGE_ICON_MAP: Record<string, BadgeIconConfig> = {
  'first-trade': { icon: ArrowRightLeft, earnedColor: 'text-success' },
  'market-maker': { icon: PlusCircle, earnedColor: 'text-primary' },
  commentator: { icon: MessageSquare, earnedColor: 'text-info' },
  'liquidity-provider': { icon: Droplets, earnedColor: 'text-blue-500' },
  'active-trader': { icon: Zap, earnedColor: 'text-warning' },
  'veteran-trader': { icon: Star, earnedColor: 'text-yellow-500' },
  'prolific-creator': { icon: Layers, earnedColor: 'text-purple-500' },
  'top-creator': { icon: Crown, earnedColor: 'text-primary' },
  influencer: { icon: Users, earnedColor: 'text-pink-500' },
  forecaster: { icon: Target, earnedColor: 'text-success' },
}

const DEFAULT_ICON: BadgeIconConfig = { icon: BarChart2, earnedColor: 'text-primary' }

function BadgeItem({ badge, showUnearned = true }: { badge: UserBadge; showUnearned?: boolean }) {
  const config = BADGE_ICON_MAP[badge.id] ?? DEFAULT_ICON
  const Icon = config.icon

  if (!badge.earned && !showUnearned) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          data-testid={`badge-${badge.id}`}
          data-earned={badge.earned}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
            badge.earned
              ? 'border-current bg-background shadow-soft-sm'
              : 'border-muted bg-muted/30 opacity-40'
          )}
        >
          <Icon
            className={cn('h-4 w-4', badge.earned ? config.earnedColor : 'text-muted-foreground')}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[180px] text-center">
        <p className="font-semibold">{badge.name}</p>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
        {!badge.earned && <p className="mt-1 text-xs italic text-muted-foreground">Not yet earned</p>}
      </TooltipContent>
    </Tooltip>
  )
}

export function UserBadgesDisplay({
  userId,
  showUnearned = true,
  maxBadges,
}: {
  userId: string
  showUnearned?: boolean
  maxBadges?: number
}) {
  const { data, isLoading } = useUserBadges({ userId })

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    )
  }

  const badges = data?.data ?? []
  const visibleBadges = showUnearned ? badges : badges.filter((b) => b.earned)
  const limited = maxBadges != null ? visibleBadges.slice(0, maxBadges) : visibleBadges

  if (limited.length === 0) return null

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2" data-testid="user-badges-display">
        {limited.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} showUnearned={showUnearned} />
        ))}
      </div>
    </TooltipProvider>
  )
}
