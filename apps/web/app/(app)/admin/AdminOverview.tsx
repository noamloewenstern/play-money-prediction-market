'use client'

import React from 'react'
import useSWR from 'swr'
import { getAdminStats } from '@play-money/api-helpers/client'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'

export function AdminOverview() {
  const { data, isLoading } = useSWR('admin-stats', () => getAdminStats())

  const stats = data?.data

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Platform Overview</h3>
        <p className="text-sm text-muted-foreground">Key metrics and platform health.</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading stats...</div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">+{stats.users.newToday} today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.newThisWeek}</div>
                <p className="text-xs text-muted-foreground">{stats.users.newThisMonth} this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.markets.total}</div>
                <p className="text-xs text-muted-foreground">{stats.markets.active} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trades (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.trades.last24h}</div>
                <p className="text-xs text-muted-foreground">buy &amp; sell transactions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Markets Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium">{stats.markets.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-medium">{stats.markets.resolved}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Canceled</span>
                  <span className="font-medium">{stats.markets.canceled}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{stats.comments.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hidden</span>
                  <span className="font-medium">{stats.comments.hidden}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">User Growth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Today</span>
                  <span className="font-medium">+{stats.users.newToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-medium">+{stats.users.newThisWeek}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-medium">+{stats.users.newThisMonth}</span>
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
