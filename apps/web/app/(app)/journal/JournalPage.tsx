'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BookOpenIcon, CheckCircleIcon, XCircleIcon, ClockIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { useMyTradeJournal, TradeJournalEntry } from '@play-money/api-helpers/client/hooks'
import { updateTradeJournalNote } from '@play-money/api-helpers/client'
import { Button } from '@play-money/ui/button'
import { Textarea } from '@play-money/ui/textarea'
import { Badge } from '@play-money/ui/badge'
import { toast } from '@play-money/ui/use-toast'
import { useUser } from '@play-money/users/context/UserContext'

function JournalEntryCard({ entry, onNoteUpdated }: { entry: TradeJournalEntry; onNoteUpdated: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [noteText, setNoteText] = useState(entry.note ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const isResolved = Boolean(entry.market.resolvedAt)
  const isCanceled = Boolean(entry.market.canceledAt)
  const outcome = isResolved ? entry.market.marketResolution?.resolutionId === entry.optionId ? 'correct' : 'incorrect' : null

  const handleSaveNote = async () => {
    setIsSaving(true)
    try {
      await updateTradeJournalNote({ id: entry.id, note: noteText })
      toast({ title: 'Note saved', variant: 'success' })
      setIsEditing(false)
      onNoteUpdated()
    } catch {
      toast({ title: 'Failed to save note', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3" data-testid="journal-entry">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/questions/${entry.market.id}/${entry.market.slug}`}
            className="text-sm font-medium hover:underline line-clamp-2"
          >
            {entry.market.question}
          </Link>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isResolved ? (
            outcome === 'correct' ? (
              <Badge variant="success" className="text-xs">
                <CheckCircleIcon className="mr-1 h-3 w-3" />
                Correct
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <XCircleIcon className="mr-1 h-3 w-3" />
                Incorrect
              </Badge>
            )
          ) : isCanceled ? (
            <Badge variant="secondary" className="text-xs">Canceled</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <ClockIcon className="mr-1 h-3 w-3" />
              Open
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {entry.tradeType === 'BUY' ? (
            <TrendingUpIcon className="h-3 w-3 text-success" />
          ) : (
            <TrendingDownIcon className="h-3 w-3 text-destructive" />
          )}
          <span className={entry.tradeType === 'BUY' ? 'text-success font-medium' : 'text-destructive font-medium'}>
            {entry.tradeType === 'BUY' ? 'Bought' : 'Sold'}
          </span>
          <span
            className="inline-block h-2 w-2 rounded-full ml-1"
            style={{ backgroundColor: entry.option.color }}
          />
          <span>{entry.option.name}</span>
        </div>
        {entry.probabilityAtTrade != null ? (
          <span>at {entry.probabilityAtTrade}%</span>
        ) : null}
        <span>{formattedDate}</span>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add your reasoning..."
            className="h-24 resize-none text-sm"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{noteText.length}/2000</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setIsEditing(false); setNoteText(entry.note ?? '') }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => void handleSaveNote()} loading={isSaving}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {entry.note ? (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {entry.note ? 'Edit note' : '+ Add reasoning note'}
          </button>
        </div>
      )}
    </div>
  )
}

export function JournalPage() {
  const { user } = useUser()
  const { data, isLoading, mutate, size, setSize } = useMyTradeJournal({ skip: !user })

  const allEntries = data?.flatMap((page) => page.data) ?? []
  const lastPage = data?.[data.length - 1]
  const hasNextPage = lastPage?.pageInfo.hasNextPage ?? false
  const total = lastPage?.pageInfo.total ?? 0

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">Please log in to view your decision journal.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4">
      <div className="flex items-center gap-3">
        <BookOpenIcon className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Decision Journal</h1>
          <p className="text-sm text-muted-foreground">
            Review your trade history, reasoning, and outcomes to improve your forecasting.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : allEntries.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <BookOpenIcon className="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No trades yet</h3>
          <p className="text-sm text-muted-foreground">
            Your trade history will appear here. You can add reasoning notes when buying or selling.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/questions">Browse questions</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total} trade{total !== 1 ? 's' : ''} recorded</p>
          <div className="space-y-3">
            {allEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onNoteUpdated={() => void mutate()}
              />
            ))}
          </div>
          {hasNextPage ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void setSize(size + 1)}
            >
              Load more
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
