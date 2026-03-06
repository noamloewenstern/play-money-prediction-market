'use client'

import { ShieldCheck } from 'lucide-react'
import React from 'react'
import { useCreatorReputation } from '@play-money/api-helpers/client/hooks'
import { Tooltip, TooltipContent, TooltipTrigger } from '@play-money/ui/tooltip'
import { cn } from '@play-money/ui/utils'

function getReputationLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Developing'
  return 'New'
}

function getReputationColor(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-info'
  if (score >= 40) return 'text-warning'
  return 'text-muted-foreground'
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="w-6 text-right tabular-nums">{value}</span>
      </div>
    </div>
  )
}

export function CreatorReputationBadge({
  userId,
  size = 'default',
}: {
  userId: string
  size?: 'sm' | 'default'
}) {
  const { data } = useCreatorReputation({ userId })
  const reputation = data?.data

  if (!reputation || reputation.totalMarkets === 0) return null

  const label = getReputationLabel(reputation.score)
  const colorClass = getReputationColor(reputation.score)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex cursor-default items-center gap-1 font-medium',
            colorClass,
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
          data-testid="creator-reputation-badge"
        >
          <ShieldCheck className={size === 'sm' ? 'size-3.5' : 'size-4'} />
          <span className="tabular-nums">{reputation.score}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="w-56 p-3" side="bottom">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Creator Reputation</span>
            <span className={cn('text-xs font-medium', colorClass)}>{label}</span>
          </div>
          <div className="space-y-1 text-xs">
            <BreakdownRow label="Resolution rate" value={reputation.breakdown.resolutionRate} />
            <BreakdownRow label="Timeliness" value={reputation.breakdown.timeliness} />
            <BreakdownRow label="Traders attracted" value={reputation.breakdown.traderAttraction} />
            <BreakdownRow label="Volume generated" value={reputation.breakdown.volumeGenerated} />
            <BreakdownRow label="Engagement" value={reputation.breakdown.communityEngagement} />
          </div>
          <div className="border-t pt-1.5 text-xs text-muted-foreground">
            Based on {reputation.totalMarkets} market{reputation.totalMarkets !== 1 ? 's' : ''} ({reputation.resolvedMarkets} resolved)
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
