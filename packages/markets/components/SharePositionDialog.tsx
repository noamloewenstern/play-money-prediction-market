'use client'

import { ExternalLinkIcon, CopyIcon, CheckIcon } from 'lucide-react'
import React, { useState } from 'react'
import { MarketOption } from '@play-money/database'
import { MarketOptionPositionAsNumbers } from '@play-money/finance/lib/getBalances'
import { Button } from '@play-money/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@play-money/ui/dialog'
import { toast } from '@play-money/ui/use-toast'
import { ExtendedMarket } from '../types'

export function SharePositionDialog({
  market,
  option,
  position,
  userId,
  open,
  onClose,
}: {
  market: ExtendedMarket
  option: MarketOption
  position: MarketOptionPositionAsNumbers
  userId: string
  open: boolean
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const currentProb = option.probability ?? 50
  const quantity = position.quantity
  const cost = position.cost
  const value = position.value
  const entryPrice = quantity > 0 ? cost / quantity : 0
  const entryProb = Math.round(entryPrice * 100)
  const pnl = value - cost
  const pnlPct = cost > 0 ? Math.round(((value - cost) / cost) * 100) : 0
  const isPositive = pnl >= 0

  const shareUrl = `${window.location.origin}/share/position?marketId=${market.id}&optionId=${option.id}&userId=${userId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({ title: 'Share link copied to clipboard!' })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShareTwitter = () => {
    const pnlLabel = isPositive ? `+${pnlPct}%` : `${pnlPct}%`
    const text = `I'm holding "${option.name}" at ${currentProb}% (${pnlLabel} P&L) on this prediction:\n\n"${market.question}"\n\nMake your prediction:`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share your position</DialogTitle>
        </DialogHeader>

        {/* Card preview */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 text-sm font-medium leading-snug text-foreground">{market.question}</div>

          <div className="flex items-center gap-2 text-sm">
            <div className="size-3 rounded" style={{ backgroundColor: option.color }} />
            <span className="font-medium">{option.name}</span>
          </div>

          <div className="mt-3 flex gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Bought at</div>
              <div className="text-lg font-bold">{entryProb}%</div>
            </div>
            <div className="flex items-end pb-1 text-muted-foreground">&rarr;</div>
            <div>
              <div className="text-xs text-muted-foreground">Now at</div>
              <div className="text-lg font-bold" style={{ color: option.color }}>
                {currentProb}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">P&L</div>
              <div className={`text-lg font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}
                {pnlPct}%
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
            {copied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
          <Button className="flex-1" onClick={handleShareTwitter}>
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            Share on X
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
