'use client'

import React, { useMemo } from 'react'
import { MarketOption } from '@play-money/database'
import { useMarketGraph } from '@play-money/api-helpers/client/hooks'
import { cn } from '@play-money/ui/utils'
import { formatProbability } from './MarketProbabilityDetail'

type SparklineProps = {
  data: Array<number>
  color: string
  width?: number
  height?: number
}

function Sparkline({ data, color, width = 48, height = 20 }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 2) - 1
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" points={points.join(' ')} />
    </svg>
  )
}

export function MarketComparisonView({
  options,
  probabilities,
  activeOptionId,
  marketId,
  onSelect,
}: {
  options: Array<MarketOption>
  probabilities: Record<string, number>
  activeOptionId?: string
  marketId: string
  onSelect: (optionId: string) => void
}) {
  const { data: graph } = useMarketGraph({ marketId })

  const sparklineData = useMemo(() => {
    if (!graph?.data) return {}
    const result: Record<string, Array<number>> = {}
    for (const option of options) {
      result[option.id] = graph.data.map((point) => {
        const opt = point.options.find((o) => o.id === option.id)
        return opt?.probability ?? 0
      })
    }
    return result
  }, [graph?.data, options])

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => (probabilities[b.id] || b.probability || 0) - (probabilities[a.id] || a.probability || 0)),
    [options, probabilities]
  )

  const maxProbability = useMemo(
    () => Math.max(...sortedOptions.map((o) => probabilities[o.id] || o.probability || 0), 1),
    [sortedOptions, probabilities]
  )

  return (
    <div className="space-y-1.5" data-testid="comparison-view">
      {sortedOptions.map((option) => {
        const probability = probabilities[option.id] || option.probability || 0
        const barWidth = (probability / maxProbability) * 100
        const isActive = option.id === activeOptionId

        return (
          <button
            key={option.id}
            type="button"
            data-testid={`comparison-bar-${option.id}`}
            className={cn(
              'group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50',
              isActive && 'bg-muted/50 ring-1 ring-border'
            )}
            onClick={() => onSelect(option.id)}
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="line-clamp-1 text-sm font-medium">{option.name}</span>
                <div className="flex items-center gap-2">
                  {sparklineData[option.id] ? (
                    <Sparkline data={sparklineData[option.id]} color={option.color} />
                  ) : null}
                  <span className="min-w-[3ch] text-right text-sm font-semibold tabular-nums" style={{ color: option.color }}>
                    {formatProbability(probability)}
                  </span>
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: option.color,
                    opacity: isActive ? 1 : 0.7,
                  }}
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
