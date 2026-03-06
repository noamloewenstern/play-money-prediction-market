'use client'

import { formatDistanceToNow } from 'date-fns'
import { ThumbsDownIcon, ThumbsUpIcon, TrashIcon, ExternalLinkIcon } from 'lucide-react'
import React, { useState } from 'react'
import { mutate } from 'swr'
import { MarketEvidenceResponse, deleteMarketEvidence, voteOnMarketEvidence } from '@play-money/api-helpers/client'
import { MARKET_EVIDENCE_PATH } from '@play-money/api-helpers/client/hooks'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { toast } from '@play-money/ui/use-toast'
import { cn } from '@play-money/ui/utils'
import { UserLink } from '@play-money/users/components/UserLink'

function EvidenceTypeBadge({ evidenceType }: { evidenceType: MarketEvidenceResponse['evidenceType'] }) {
  if (evidenceType === 'FOR') {
    return <Badge variant="success">For</Badge>
  }
  if (evidenceType === 'AGAINST') {
    return <Badge variant="destructive">Against</Badge>
  }
  return <Badge variant="secondary">Neutral</Badge>
}

export function EvidenceItem({
  evidence,
  marketId,
  canDelete,
  onDelete,
}: {
  evidence: MarketEvidenceResponse
  marketId: string
  canDelete?: boolean
  onDelete?: () => void
}) {
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleVote = async (isUpvote: boolean) => {
    if (isVoting) return
    setIsVoting(true)
    try {
      await voteOnMarketEvidence({ marketId, evidenceId: evidence.id, isUpvote })
      void mutate(MARKET_EVIDENCE_PATH(marketId))
    } catch (error) {
      toast({
        title: 'Failed to vote',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deleteMarketEvidence({ marketId, evidenceId: evidence.id })
      toast({ title: 'Evidence deleted' })
      onDelete?.()
      void mutate(MARKET_EVIDENCE_PATH(marketId))
    } catch (error) {
      toast({
        title: 'Failed to delete evidence',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const score = evidence.upvoteCount - evidence.downvoteCount

  return (
    <div className="flex gap-3 py-3">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => handleVote(true)}
          disabled={isVoting}
          className={cn(
            'rounded p-1 transition-colors hover:bg-muted',
            evidence.userVote === true && 'text-success'
          )}
          aria-label="Upvote"
        >
          <ThumbsUpIcon className="size-4" />
        </button>
        <span className={cn('text-xs font-semibold tabular-nums', score > 0 ? 'text-success' : score < 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {score}
        </span>
        <button
          type="button"
          onClick={() => handleVote(false)}
          disabled={isVoting}
          className={cn(
            'rounded p-1 transition-colors hover:bg-muted',
            evidence.userVote === false && 'text-destructive'
          )}
          aria-label="Downvote"
        >
          <ThumbsDownIcon className="size-4" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <EvidenceTypeBadge evidenceType={evidence.evidenceType} />
            <span className="truncate font-semibold">{evidence.title}</span>
          </div>
          {canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete evidence"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          ) : null}
        </div>

        <p className="mt-1 text-sm text-muted-foreground">{evidence.content}</p>

        {evidence.url ? (
          <a
            href={evidence.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon className="size-3" />
            {evidence.url}
          </a>
        ) : null}

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserAvatar user={evidence.author} size="sm" />
          <UserLink user={evidence.author} hideUsername />
          <span>·</span>
          <span>{formatDistanceToNow(new Date(evidence.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  )
}
