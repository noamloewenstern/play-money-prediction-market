'use client'

import { CheckCircle2Icon, CircleDotIcon, CoinsIcon, DiamondPlusIcon, MessageSquareIcon, TrendingUpIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useUserStats } from '@play-money/api-helpers/client/hooks'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import {
  DAILY_COMMENT_BONUS_PRIMARY,
  DAILY_LIQUIDITY_BONUS_PRIMARY,
  DAILY_MARKET_BONUS_PRIMARY,
  DAILY_TRADE_BONUS_PRIMARY,
} from '@play-money/finance/economy'
import { Badge } from '@play-money/ui/badge'
import { cn } from '@play-money/ui/utils'
import { useUser } from '../context/UserContext'

type Milestone = {
  key: string
  title: string
  description: string
  award: number
  href: string
  icon: React.ReactNode
  completed: boolean
}

function getMilestones(milestones?: {
  hasTraded: boolean
  hasCreatedMarket: boolean
  hasCommented: boolean
  hasBoostedLiquidity: boolean
}): Array<Milestone> {
  return [
    {
      key: 'trade',
      title: 'Place your first trade',
      description: 'Buy shares in an outcome you believe in',
      award: DAILY_TRADE_BONUS_PRIMARY,
      href: '/questions',
      icon: <TrendingUpIcon className="size-4" />,
      completed: milestones?.hasTraded ?? false,
    },
    {
      key: 'market',
      title: 'Create your first market',
      description: 'Ask a question for the community to predict',
      award: DAILY_MARKET_BONUS_PRIMARY,
      href: '/create-post',
      icon: <CoinsIcon className="size-4" />,
      completed: milestones?.hasCreatedMarket ?? false,
    },
    {
      key: 'comment',
      title: 'Write your first comment',
      description: 'Share your reasoning on a prediction',
      award: DAILY_COMMENT_BONUS_PRIMARY,
      href: '/questions',
      icon: <MessageSquareIcon className="size-4" />,
      completed: milestones?.hasCommented ?? false,
    },
    {
      key: 'liquidity',
      title: 'Boost liquidity',
      description: 'Add liquidity to a market to earn trading fees',
      award: DAILY_LIQUIDITY_BONUS_PRIMARY,
      href: '/questions',
      icon: <DiamondPlusIcon className="size-4" />,
      completed: milestones?.hasBoostedLiquidity ?? false,
    },
  ]
}

function MilestoneStep({ milestone, isLast, isOwnProfile }: { milestone: Milestone; isLast: boolean; isOwnProfile: boolean }) {
  const content = (
    <div className="group flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-full border-2 transition-colors',
            milestone.completed
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 bg-background text-muted-foreground',
            !milestone.completed && isOwnProfile && 'group-hover:border-primary/50'
          )}
        >
          {milestone.completed ? <CheckCircle2Icon className="size-4" /> : milestone.icon}
        </div>
        {!isLast ? (
          <div
            className={cn('mt-1 h-full w-0.5', milestone.completed ? 'bg-primary' : 'bg-muted-foreground/20')}
          />
        ) : null}
      </div>
      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium',
              milestone.completed ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            {milestone.title}
          </p>
          {!milestone.completed ? (
            <Badge variant="secondary" className="text-xs">
              +<CurrencyDisplay value={milestone.award} />
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
      </div>
    </div>
  )

  if (isOwnProfile && !milestone.completed) {
    return <Link href={milestone.href}>{content}</Link>
  }

  return content
}

export function ActivityMilestoneTimeline({ userId }: { userId: string }) {
  const { user } = useUser()
  const { data: statsData } = useUserStats({ userId })
  const isOwnProfile = user?.id === userId

  const milestones = getMilestones(statsData?.data?.milestones)
  const completedCount = milestones.filter((m) => m.completed).length

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CircleDotIcon className="size-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">
          {isOwnProfile ? 'Get started on Play Money' : 'Getting started'}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {isOwnProfile
            ? 'Complete these milestones to earn bonus rewards and unlock the full experience.'
            : 'Milestones to unlock on Play Money.'}
        </p>
        <Badge variant="outline" className="mt-1">
          {completedCount} / {milestones.length} completed
        </Badge>
      </div>

      <div className="w-full max-w-sm">
        {milestones.map((milestone, i) => (
          <MilestoneStep
            key={milestone.key}
            milestone={milestone}
            isLast={i === milestones.length - 1}
            isOwnProfile={isOwnProfile}
          />
        ))}
      </div>
    </div>
  )
}
