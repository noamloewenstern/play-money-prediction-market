'use client'

import React from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

type GraphDataPoint = {
  startAt: string
  endAt: string
  options: Array<{
    id: string
    probability: number
  }>
}

type MarketOption = {
  id: string
  name: string
  color: string | null
}

export function EmbedMarketChart({
  data,
  options,
}: {
  data: Array<GraphDataPoint>
  options: Array<MarketOption>
}) {
  if (!data || data.length === 0) return null

  const sortedOptions = [...options].sort((a, b) => a.id.localeCompare(b.id))

  return (
    <ResponsiveContainer width="100%" height={72}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Tooltip
          content={({ payload }) => {
            const point = payload?.[0]?.payload as GraphDataPoint | undefined
            if (!point) return null
            return (
              <div className="rounded border bg-background px-2 py-1 text-xs shadow">
                {sortedOptions.map((option) => {
                  const opt = point.options.find((o) => o.id === option.id)
                  if (!opt) return null
                  return (
                    <div key={option.id} style={{ color: option.color ?? undefined }}>
                      {option.name}: {Math.round(opt.probability)}%
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
        {sortedOptions.map((option) => (
          <Line
            key={option.id}
            type="step"
            dot={false}
            dataKey={(point: GraphDataPoint) => {
              const opt = point.options.find((o) => o.id === option.id)
              return opt?.probability ?? null
            }}
            stroke={option.color ?? '#8884d8'}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
