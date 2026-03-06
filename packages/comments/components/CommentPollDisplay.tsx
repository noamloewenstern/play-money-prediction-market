'use client'

import { formatDistance } from 'date-fns'
import { BarChart3 } from 'lucide-react'
import React from 'react'
import { CommentPollWithOptions } from '@play-money/comments/lib/getComment'
import { cn } from '@play-money/ui/utils'

export function CommentPollDisplay({
  poll,
  activeUserId,
  onVote,
  isPending,
}: {
  poll: CommentPollWithOptions
  activeUserId?: string
  onVote?: (pollId: string, optionId: string) => void
  isPending?: boolean
}) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0)

  const userVotedOptionId = activeUserId
    ? poll.options.find((opt) => opt.votes.some((v) => v.userId === activeUserId))?.id ?? null
    : null

  const isPollClosed = poll.closesAt ? new Date(poll.closesAt) < new Date() : false
  const canVote = Boolean(activeUserId) && !isPollClosed && Boolean(onVote)

  const handleVote = (optionId: string) => {
    if (!canVote) return
    onVote?.(poll.id, optionId)
  }

  return (
    <div
      className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-2"
      data-testid="comment-poll"
    >
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <span>{poll.question}</span>
      </div>

      <div className="space-y-1.5">
        {poll.options.map((option) => {
          const voteCount = option.votes.length
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
          const isSelected = userVotedOptionId === option.id

          return (
            <button
              key={option.id}
              type="button"
              disabled={!canVote || isPending}
              onClick={() => handleVote(option.id)}
              className={cn(
                'relative w-full overflow-hidden rounded-md border text-left transition-colors',
                canVote && !isPending
                  ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5'
                  : 'cursor-default',
                isSelected ? 'border-primary bg-primary/10' : 'border-border bg-background',
              )}
              data-testid={`poll-option-${option.id}`}
            >
              {/* Progress bar background */}
              <div
                className={cn(
                  'absolute inset-y-0 left-0 transition-all duration-500',
                  isSelected ? 'bg-primary/20' : 'bg-muted/50',
                )}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between px-3 py-1.5">
                <span className={cn('text-sm', isSelected && 'font-medium')}>{option.text}</span>
                <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                  {percentage}% ({voteCount})
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {isPollClosed ? (
          <span className="text-destructive">Closed</span>
        ) : poll.closesAt ? (
          <span>Closes {formatDistance(new Date(poll.closesAt), new Date(), { addSuffix: true })}</span>
        ) : (
          <span>Open</span>
        )}
      </div>
    </div>
  )
}
