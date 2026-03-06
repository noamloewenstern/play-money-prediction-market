'use client'

import React from 'react'
import { MessageSquarePlus, Coins } from 'lucide-react'
import { DAILY_COMMENT_BONUS_PRIMARY } from '@play-money/finance/economy'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'

const STARTER_POOL = [
  'What evidence would change your position on this?',
  "What's the strongest argument for Yes?",
  "What's the strongest argument for No?",
  'What key factors will determine the outcome?',
  'What information are we missing to make a better prediction?',
  'How confident are you in your position, and why?',
  'What would need to happen for this to resolve differently than expected?',
  'What similar events in the past can guide our thinking here?',
  'Is the current probability too high, too low, or about right?',
  'What timeline do you expect for this to play out?',
]

function getStartersForQuestion(question: string): Array<string> {
  let hash = 0
  for (let i = 0; i < question.length; i++) {
    hash = (hash << 5) - hash + question.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % STARTER_POOL.length

  const starters: Array<string> = []
  for (let i = 0; i < 3; i++) {
    starters.push(STARTER_POOL[(index + i) % STARTER_POOL.length])
  }
  return starters
}

export function DiscussionStarters({
  marketQuestion,
  onStarterClick,
}: {
  marketQuestion: string
  onStarterClick: (text: string) => void
}) {
  const starters = getStartersForQuestion(marketQuestion)

  return (
    <div className="px-6 pb-4">
      <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageSquarePlus className="h-4 w-4" />
          Start the discussion
        </div>

        <div className="space-y-2">
          {starters.map((starter) => (
            <button
              key={starter}
              type="button"
              className="block w-full rounded-md border border-transparent bg-background px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
              onClick={() => onStarterClick(`<p>${starter}</p>`)}
            >
              &ldquo;{starter}&rdquo;
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <Coins className="h-3 w-3" />
          <span>
            Earn <CurrencyDisplay value={DAILY_COMMENT_BONUS_PRIMARY} className="text-xs" /> daily bonus for commenting
          </span>
        </div>
      </div>
    </div>
  )
}
