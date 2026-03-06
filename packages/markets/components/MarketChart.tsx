'use client'

import { format } from 'date-fns'
import React, { useMemo, useState } from 'react'
import {
  Bar,
  ComposedChart,
  Line,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
  XAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Brush,
  Cell,
} from 'recharts'
import { useMarketBalance, useMarketGraph } from '@play-money/api-helpers/client/hooks'
import { formatCurrency, formatNumber } from '@play-money/finance/lib/formatCurrency'
import { Card } from '@play-money/ui/card'
import { cn } from '@play-money/ui/utils'
import { useUser } from '@play-money/users/context/UserContext'
import { ExtendedMarket } from '../types'
import { formatProbability } from './MarketProbabilityDetail'

const CURRENCY_SYMBOL = '¤'
function fmtCurrency(value: number, short = false) {
  return short ? formatNumber(value) : formatCurrency(value, CURRENCY_SYMBOL, 0)
}

type ChartTab = 'probability' | 'volume' | 'pnl'

function CustomizedXAxisTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={5} dx={-4} textAnchor="end" className="fill-muted-foreground/50" fontSize={10}>
        {format(payload.value, 'MMM d')}
      </text>
    </g>
  )
}

function CustomizedYAxisTick({ x, y, payload }: { x: number; y: number; payload: { value: string | number } }) {
  return payload.value !== 0 ? (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} dx={2} textAnchor="start" className="fill-muted-foreground/50" fontSize={10}>
        {payload.value}%
      </text>
    </g>
  ) : (
    <g />
  )
}

function ProbabilityChart({
  market,
  activeOptionId,
  graphData,
}: {
  market: ExtendedMarket
  activeOptionId: string
  graphData: NonNullable<ReturnType<typeof useMarketGraph>['data']>['data']
}) {
  const createdOrderOptions = useMemo(
    () => [...market.options].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [market.options]
  )
  const activeOptionIndex = createdOrderOptions.findIndex((o) => o.id === activeOptionId)
  const maxVolume = useMemo(() => Math.max(...graphData.map((d) => d.volume ?? 0), 1), [graphData])

  const resolutionAt = market.resolvedAt ?? market.canceledAt
  const resolutionEndAt = useMemo(() => {
    if (!resolutionAt) return null
    const resTime = new Date(resolutionAt).getTime()
    const closest = graphData.reduce<{ endAt: Date | string; diff: number } | null>((prev, curr) => {
      const diff = Math.abs(new Date(curr.endAt).getTime() - resTime)
      return prev === null || diff < prev.diff ? { endAt: curr.endAt, diff } : prev
    }, null)
    return closest?.endAt ?? null
  }, [graphData, resolutionAt])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={graphData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/40)" vertical={false} />
        <ChartTooltip
          content={({ payload }) => {
            const data = payload?.[0]?.payload
            if (data) {
              return (
                <Card className="p-2 font-mono text-xs">
                  <div className="mb-1 text-muted-foreground">{format(data.startAt, 'MMM d, yyyy HH:mm')}</div>
                  {createdOrderOptions.map((option) => {
                    const dataOption = data.options.find((o: { id: string; probability: number }) => o.id === option.id)
                    return (
                      <div key={option.id} className="flex items-center gap-1.5" style={{ color: option.color }}>
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        {option.name}: {dataOption ? formatProbability(dataOption.probability) : '—'}
                      </div>
                    )
                  })}
                  {(data.volume ?? 0) > 0 ? (
                    <div className="mt-1 border-t pt-1 text-muted-foreground">
                      Vol: {fmtCurrency(data.volume ?? 0, true)} ({data.tradeCount ?? 0} trades)
                    </div>
                  ) : null}
                </Card>
              )
            }
            return null
          }}
        />
        <XAxis
          height={20}
          dataKey="endAt"
          stroke="hsl(var(--border))"
          className="font-mono text-[10px] uppercase"
          minTickGap={80}
          tick={CustomizedXAxisTick}
        />
        <YAxis
          yAxisId="probability"
          type="number"
          domain={[0, 100]}
          width={40}
          stroke="hsl(var(--border))"
          className="font-mono text-[10px]"
          orientation="right"
          tick={CustomizedYAxisTick}
        />
        <YAxis
          yAxisId="volume"
          type="number"
          domain={[0, maxVolume * 4]}
          hide
          orientation="left"
        />

        {/* Volume bars at bottom (25% of chart height) */}
        <Bar
          yAxisId="volume"
          dataKey="volume"
          fill="hsl(var(--muted-foreground)/20)"
          radius={[2, 2, 0, 0]}
          isAnimationActive={false}
        />

        {/* Option probability lines */}
        {createdOrderOptions.map((option) => (
          <Line
            key={option.id}
            yAxisId="probability"
            type="step"
            dot={false}
            dataKey={(data) => {
              const dataOption = data.options.find((o: { id: string; probability: number }) => o.id === option.id)
              return dataOption?.probability ?? null
            }}
            name={option.name}
            stroke={option.color}
            opacity={activeOptionIndex !== -1 && option.id !== activeOptionId ? 0.3 : 1}
            strokeWidth={option.id === activeOptionId ? 2.5 : 1.5}
            strokeLinejoin="round"
            animationDuration={750}
          />
        ))}

        {/* Resolution annotation */}
        {resolutionEndAt ? (
          <ReferenceLine
            yAxisId="probability"
            x={resolutionEndAt as string}
            stroke="hsl(var(--muted-foreground)/60)"
            strokeDasharray="4 2"
            label={{
              value: 'Resolved',
              position: 'top',
              fontSize: 10,
              fill: 'hsl(var(--muted-foreground))',
            }}
          />
        ) : null}

        <Brush
          dataKey="endAt"
          height={20}
          stroke="hsl(var(--border))"
          fill="hsl(var(--background))"
          travellerWidth={6}
          tickFormatter={(value) => format(value, 'MMM d')}
          className="font-mono text-[9px]"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function VolumeChart({
  graphData,
}: {
  graphData: NonNullable<ReturnType<typeof useMarketGraph>['data']>['data']
}) {
  const hasVolume = graphData.some((d) => (d.volume ?? 0) > 0)

  if (!hasVolume) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No volume data yet</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={graphData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/40)" vertical={false} />
        <ChartTooltip
          content={({ payload }) => {
            const data = payload?.[0]?.payload
            if (data) {
              return (
                <Card className="p-2 font-mono text-xs">
                  <div className="mb-1 text-muted-foreground">{format(data.startAt, 'MMM d, yyyy')}</div>
                  <div>Volume: {fmtCurrency(data.volume ?? 0, true)}</div>
                  <div>Trades: {data.tradeCount ?? 0}</div>
                </Card>
              )
            }
            return null
          }}
        />
        <XAxis
          height={20}
          dataKey="endAt"
          stroke="hsl(var(--border))"
          className="font-mono text-[10px]"
          minTickGap={80}
          tick={CustomizedXAxisTick}
        />
        <YAxis
          width={50}
          stroke="hsl(var(--border))"
          className="font-mono text-[10px]"
          orientation="right"
          tickFormatter={(v) => fmtCurrency(v, true)}
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <text x={0} y={0} dy={4} dx={2} textAnchor="start" className="fill-muted-foreground/50" fontSize={10}>
                {fmtCurrency(payload.value, true)}
              </text>
            </g>
          )}
        />
        <Bar dataKey="volume" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {graphData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`hsl(var(--primary)/${(entry.volume ?? 0) > 0 ? '80' : '20'})`} />
          ))}
        </Bar>
        <Brush
          dataKey="endAt"
          height={20}
          stroke="hsl(var(--border))"
          fill="hsl(var(--background))"
          travellerWidth={6}
          tickFormatter={(value) => format(value, 'MMM d')}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

function PnlChart({ market }: { market: ExtendedMarket }) {
  const { user } = useUser()
  const { data: balanceData } = useMarketBalance({ marketId: market.id })
  const positions = balanceData?.data?.userPositions ?? []

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Sign in to view your P&amp;L
      </div>
    )
  }

  const pnlData = market.options
    .map((option) => {
      const position = positions.find((p) => p.optionId === option.id)
      if (!position || position.cost === 0) return null
      return {
        name: option.name,
        color: option.color,
        cost: position.cost,
        value: position.value,
        pnl: position.value - position.cost,
        quantity: position.quantity,
      }
    })
    .filter(Boolean) as Array<{
    name: string
    color: string
    cost: number
    value: number
    pnl: number
    quantity: number
  }>

  if (pnlData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No positions in this market
      </div>
    )
  }

  const barData = pnlData.map((d) => ({
    name: d.name.length > 16 ? d.name.slice(0, 14) + '…' : d.name,
    fullName: d.name,
    color: d.color,
    pnl: d.pnl,
    cost: d.cost,
    value: d.value,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={barData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/40)" horizontal={false} />
        <ChartTooltip
          content={({ payload }) => {
            const data = payload?.[0]?.payload
            if (data) {
              return (
                <Card className="p-2 font-mono text-xs">
                  <div className="mb-1 font-semibold">{data.fullName}</div>
                  <div>Cost: {fmtCurrency(data.cost)}</div>
                  <div>Value: {fmtCurrency(data.value)}</div>
                  <div
                    className={cn('font-semibold', data.pnl >= 0 ? 'text-success' : 'text-destructive')}
                  >
                    P&amp;L: {data.pnl >= 0 ? '+' : ''}{fmtCurrency(data.pnl)}
                  </div>
                </Card>
              )
            }
            return null
          }}
        />
        <XAxis
          type="number"
          stroke="hsl(var(--border))"
          tickFormatter={(v) => fmtCurrency(v, true)}
          className="font-mono text-[10px]"
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <text x={0} y={0} dy={12} textAnchor="middle" className="fill-muted-foreground/50" fontSize={10}>
                {fmtCurrency(payload.value, true)}
              </text>
            </g>
          )}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={70}
          stroke="hsl(var(--border))"
          className="font-mono text-[10px]"
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <text x={0} y={0} dy={4} dx={-2} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                {payload.value}
              </text>
            </g>
          )}
        />
        <ReferenceLine x={0} stroke="hsl(var(--border))" />
        <Bar dataKey="pnl" radius={[0, 2, 2, 0]} isAnimationActive={false}>
          {barData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
              opacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function MarketChart({ market, activeOptionId }: { market: ExtendedMarket; activeOptionId: string }) {
  const { data: graph } = useMarketGraph({ marketId: market.id })
  const [activeTab, setActiveTab] = useState<ChartTab>('probability')

  const tabs: Array<{ id: ChartTab; label: string }> = [
    { id: 'probability', label: 'Probability' },
    { id: 'volume', label: 'Volume' },
    { id: 'pnl', label: 'My P&L' },
  ]

  return (
    <div data-testid="market-chart">
      <div className="mb-2 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`market-chart-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="h-52" data-testid={`market-chart-${activeTab}`}>
        {activeTab === 'probability' ? (
          graph?.data ? (
            <ProbabilityChart market={market} activeOptionId={activeOptionId} graphData={graph.data} />
          ) : null
        ) : activeTab === 'volume' ? (
          graph?.data ? (
            <VolumeChart graphData={graph.data} />
          ) : null
        ) : (
          <PnlChart market={market} />
        )}
      </Card>
    </div>
  )
}
