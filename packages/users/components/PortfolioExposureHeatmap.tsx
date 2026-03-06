'use client'

import { AlertTriangleIcon, ChevronDownIcon, ChevronRightIcon, LayersIcon, LinkIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { Badge } from '@play-money/ui/badge'
import { Card, CardContent } from '@play-money/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@play-money/ui/tooltip'
import { cn } from '@play-money/ui/utils'

type PositionDetail = {
  marketId: string
  marketQuestion: string
  optionName: string
  optionColor: string
  value: number
  cost: number
  quantity: number
  pnl: number
  pnlPercent: number
}

type TagExposure = {
  tag: string
  totalValue: number
  totalCost: number
  pnl: number
  pnlPercent: number
  positionCount: number
  positions: Array<PositionDetail>
}

type CorrelatedGroup = {
  tags: Array<string>
  totalValue: number
  positionCount: number
  marketIds: Array<string>
}

type PortfolioExposureData = {
  totalValue: number
  totalCost: number
  totalPnl: number
  maxLoss: number
  tagExposures: Array<TagExposure>
  correlatedGroups: Array<CorrelatedGroup>
  untaggedExposure: TagExposure | null
}

function getPnlColor(pnlPercent: number): string {
  if (pnlPercent > 20) return 'bg-emerald-500/20 border-emerald-500/30'
  if (pnlPercent > 5) return 'bg-emerald-500/10 border-emerald-500/20'
  if (pnlPercent > 0) return 'bg-emerald-500/5 border-emerald-500/10'
  if (pnlPercent > -5) return 'bg-red-500/5 border-red-500/10'
  if (pnlPercent > -20) return 'bg-red-500/10 border-red-500/20'
  return 'bg-red-500/20 border-red-500/30'
}

function getConcentrationLevel(percent: number): { label: string; variant: 'default' | 'warning' | 'destructive' } {
  if (percent >= 50) return { label: 'High', variant: 'destructive' }
  if (percent >= 30) return { label: 'Moderate', variant: 'warning' }
  return { label: 'Low', variant: 'default' }
}

function TagCell({
  exposure,
  totalPortfolioValue,
}: {
  exposure: TagExposure
  totalPortfolioValue: number
}) {
  const [expanded, setExpanded] = useState(false)
  const concentrationPercent = totalPortfolioValue > 0 ? (exposure.totalValue / totalPortfolioValue) * 100 : 0
  const concentration = getConcentrationLevel(concentrationPercent)

  return (
    <div
      className={cn('rounded-lg border p-3 transition-all', getPnlColor(exposure.pnlPercent))}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{exposure.tag}</span>
            <Badge variant={concentration.variant} className="text-[10px]">
              {concentrationPercent.toFixed(0)}%
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <CurrencyDisplay value={exposure.totalValue} isShort />
            </span>
            <span className={exposure.pnl >= 0 ? 'text-success' : 'text-destructive'}>
              {exposure.pnl >= 0 ? '+' : ''}{exposure.pnlPercent.toFixed(1)}%
            </span>
            <span>{exposure.positionCount} position{exposure.positionCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {exposure.positions.map((pos) => (
            <Link
              key={`${pos.marketId}-${pos.optionName}`}
              href={`/questions/${pos.marketId}`}
              className="block rounded-md p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: pos.optionColor }}
                />
                <span className="text-xs font-medium">{pos.optionName}</span>
                <span className={cn('ml-auto text-xs', pos.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                  {pos.pnl >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{pos.marketQuestion}</p>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>
                  Value: <CurrencyDisplay value={pos.value} isShort />
                </span>
                <span>
                  Cost: <CurrencyDisplay value={pos.cost} isShort />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function HeatmapGrid({
  exposures,
  totalValue,
}: {
  exposures: Array<TagExposure>
  totalValue: number
}) {
  if (exposures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <LayersIcon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm font-semibold">No active positions</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Open positions in prediction markets to see your portfolio exposure heatmap.
        </p>
      </div>
    )
  }

  // Calculate relative sizes for the grid
  const maxValue = Math.max(...exposures.map((e) => e.totalValue))

  // Split into large cells (>15% of portfolio) and small cells
  const largeCells = exposures.filter((e) => totalValue > 0 && (e.totalValue / totalValue) * 100 >= 15)
  const smallCells = exposures.filter((e) => totalValue <= 0 || (e.totalValue / totalValue) * 100 < 15)

  return (
    <div className="space-y-2">
      {/* Large cells - full width */}
      {largeCells.map((exposure) => (
        <TagCell key={exposure.tag} exposure={exposure} totalPortfolioValue={totalValue} />
      ))}

      {/* Small cells - grid layout */}
      {smallCells.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {smallCells.map((exposure) => (
            <TagCell key={exposure.tag} exposure={exposure} totalPortfolioValue={totalValue} />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryBar({ data }: { data: PortfolioExposureData }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div>
        <div className="text-xs text-muted-foreground">Total Exposure</div>
        <div className="text-lg font-semibold">
          <CurrencyDisplay value={data.totalValue} isShort />
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Total P&L</div>
        <div className={cn('text-lg font-semibold', data.totalPnl >= 0 ? 'text-success' : 'text-destructive')}>
          {data.totalPnl >= 0 ? '+' : ''}
          <CurrencyDisplay value={Math.abs(data.totalPnl)} isShort />
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Max Loss</div>
        <div className="text-lg font-semibold text-destructive">
          <CurrencyDisplay value={data.maxLoss} isShort />
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Topics</div>
        <div className="text-lg font-semibold">{data.tagExposures.length}</div>
      </div>
    </div>
  )
}

function CorrelationSection({ groups }: { groups: Array<CorrelatedGroup> }) {
  if (groups.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <LinkIcon className="size-3.5" />
        Correlated Positions
      </div>
      <div className="space-y-2">
        {groups.slice(0, 5).map((group, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
            <div className="flex flex-wrap gap-1">
              {group.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
            <span className="ml-auto shrink-0 text-muted-foreground">
              {group.positionCount} shared market{group.positionCount !== 1 ? 's' : ''}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangleIcon className="size-3.5 text-warning" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>These tags share {group.positionCount} markets, indicating correlated exposure.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PortfolioExposureHeatmap({ data }: { data: PortfolioExposureData }) {
  const allExposures = [
    ...data.tagExposures,
    ...(data.untaggedExposure ? [data.untaggedExposure] : []),
  ]

  return (
    <div className="space-y-4" data-testid="portfolio-exposure-heatmap">
      <SummaryBar data={data} />

      {/* Concentration warning */}
      {data.tagExposures.length > 0 && data.tagExposures[0].totalValue / data.totalValue >= 0.5 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          <AlertTriangleIcon className="size-3.5 shrink-0" />
          <span>
            High concentration: <strong>{data.tagExposures[0].tag}</strong> represents{' '}
            {((data.tagExposures[0].totalValue / data.totalValue) * 100).toFixed(0)}% of your portfolio.
          </span>
        </div>
      )}

      <HeatmapGrid exposures={allExposures} totalValue={data.totalValue} />

      <CorrelationSection groups={data.correlatedGroups} />
    </div>
  )
}
