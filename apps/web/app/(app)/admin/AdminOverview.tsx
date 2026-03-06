'use client'

import { ActivityIcon, MessageSquareIcon, TrendingUpIcon, UsersIcon } from 'lucide-react'
import React from 'react'
import useSWR from 'swr'
import { getAdminStats } from '@play-money/api-helpers/client'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'
import { Skeleton } from '@play-money/ui/skeleton'

export function AdminOverview() {
  const { data, isLoading } = useSWR('admin-stats', () => getAdminStats())

  const stats = data?.data

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Platform Overview</h3>
        <p className="text-sm text-muted-foreground">Key metrics and platform health.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <UsersIcon className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-green-600 dark:text-green-400">+{stats.users.newToday}</span> today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Users (7d)</CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10">
                  <TrendingUpIcon className="size-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.users.newThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="tabular-nums">{stats.users.newThisMonth}</span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Markets</CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <ActivityIcon className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.markets.total}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="tabular-nums font-medium text-foreground">{stats.markets.active}</span> active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trades (24h)</CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <ActivityIcon className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.trades.last24h}</div>
                <p className="text-xs text-muted-foreground">buy &amp; sell transactions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Markets Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="tabular-nums font-semibold">{stats.markets.active}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="tabular-nums font-semibold">{stats.markets.resolved}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Canceled</span>
                  <span className="tabular-nums font-semibold">{stats.markets.canceled}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquareIcon className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Comments</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="tabular-nums font-semibold">{stats.comments.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hidden</span>
                  <span className="tabular-nums font-semibold">{stats.comments.hidden}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UsersIcon className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today</span>
                  <span className="tabular-nums font-semibold text-green-600 dark:text-green-400">+{stats.users.newToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="tabular-nums font-semibold">+{stats.users.newThisWeek}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="tabular-nums font-semibold">+{stats.users.newThisMonth}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">Failed to load stats.</div>
      )}
    </div>
  )
}
