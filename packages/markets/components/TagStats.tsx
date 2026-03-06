'use client'

import { BarChart2Icon, TrendingUpIcon, UsersIcon, CheckCircleIcon, ClockIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useTagStatistics } from '@play-money/api-helpers/client/hooks'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'
import { Skeleton } from '@play-money/ui/skeleton'

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function TagStats({ tag }: { tag: string }) {
  const { data, isLoading } = useTagStatistics({ tag })
  const stats = data?.data

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tag Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tag Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatRow
          icon={BarChart2Icon}
          label="Total markets"
          value={
            <span>
              {stats.totalMarkets}{' '}
              {stats.activeMarkets > 0 ? (
                <span className="text-xs text-success">({stats.activeMarkets} active)</span>
              ) : null}
            </span>
          }
        />
        <StatRow
          icon={CheckCircleIcon}
          label="Resolved"
          value={stats.resolvedMarkets}
        />
        <StatRow
          icon={TrendingUpIcon}
          label="Total volume"
          value={<CurrencyDisplay isShort value={stats.totalVolume} />}
        />
        <StatRow
          icon={UsersIcon}
          label="Total traders"
          value={stats.totalTraders}
        />
        {stats.avgResolutionDays != null ? (
          <StatRow
            icon={ClockIcon}
            label="Avg. resolution"
            value={`${stats.avgResolutionDays}d`}
          />
        ) : null}
        {stats.mostActiveMarket ? (
          <div className="border-t pt-3">
            <p className="mb-1 text-xs text-muted-foreground">Most active market</p>
            <Link
              href={`/questions/${stats.mostActiveMarket.slug}`}
              className="text-sm font-medium hover:underline line-clamp-2"
            >
              {stats.mostActiveMarket.question}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stats.mostActiveMarket.uniqueTradersCount} traders
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
