'use client'

import { format, isPast } from 'date-fns'
import { CalendarIcon, MessageSquareIcon, UsersIcon, DiamondIcon } from 'lucide-react'
import React from 'react'
import { Badge } from '@play-money/ui/badge'
import { Progress } from '@play-money/ui/progress'
import { cn } from '@play-money/ui/utils'

type PreviewOption = {
  name: string
  color: string
}

export function MarketPreviewCard({
  question,
  options,
  tags,
  closeDate,
  type,
}: {
  question: string
  options: Array<PreviewOption>
  tags: Array<string>
  closeDate: Date | null
  type: 'binary' | 'multi' | 'list'
}) {
  const filledOptions = options.filter((o) => o.name.trim())
  const equalProbability = filledOptions.length > 0 ? Math.round(100 / filledOptions.length) : 0

  const displayQuestion = question || 'Your question will appear here...'
  const isEmpty = !question && filledOptions.length === 0 && tags.length === 0 && !closeDate

  return (
    <div className={cn('rounded-lg border bg-background p-4 transition-opacity', isEmpty && 'opacity-50')}>
      {/* Header: question title */}
      <div className="line-clamp-2 text-lg font-medium leading-relaxed">
        {question ? displayQuestion : <span className="text-muted-foreground">{displayQuestion}</span>}
      </div>

      {/* Options display */}
      <div className="mt-3 space-y-2">
        {filledOptions.length > 0 ? (
          filledOptions.length <= 2 ? (
            // Binary style: show first option with progress bar
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums" style={{ color: filledOptions[0].color }}>
                {equalProbability}%
              </span>
              <Progress
                className="h-1.5 max-w-[150px] rounded-full"
                indicatorStyle={{ backgroundColor: filledOptions[0].color }}
                value={equalProbability}
              />
              <span className="text-sm text-muted-foreground">{filledOptions[0].name}</span>
            </div>
          ) : (
            // Multi/list style: show each option as a row
            <div className="space-y-1.5">
              {filledOptions.slice(0, 4).map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
                  <span className="text-sm font-semibold tabular-nums" style={{ color: option.color }}>
                    {equalProbability}%
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{option.name}</span>
                </div>
              ))}
              {filledOptions.length > 4 ? (
                <div className="text-xs text-muted-foreground">+{filledOptions.length - 4} more</div>
              ) : null}
            </div>
          )
        ) : (
          <div className="text-sm text-muted-foreground">Options will appear here...</div>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Footer: close date + placeholder stats */}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {closeDate ? (
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {isPast(closeDate) ? 'Ended' : 'Ending'} {format(closeDate, 'MMM d, yyyy')}
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1">
            <MessageSquareIcon className="size-3" strokeWidth={3} />
            0
          </div>
          <div className="flex items-center gap-1">
            <UsersIcon className="size-3" strokeWidth={3} />
            0
          </div>
          <div className="flex items-center gap-1">
            <DiamondIcon className="size-3" strokeWidth={3} />
            0
          </div>
        </div>
      </div>
    </div>
  )
}
