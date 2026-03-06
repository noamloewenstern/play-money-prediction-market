'use client'

import { AlertTriangleIcon } from 'lucide-react'
import React, { useState } from 'react'
import { mutate } from 'swr'
import { flagMarketResolutionDispute } from '@play-money/api-helpers/client'
import { MARKET_RESOLUTION_DISPUTES_PATH } from '@play-money/api-helpers/client/hooks'
import { Button } from '@play-money/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@play-money/ui/dialog'
import { Label } from '@play-money/ui/label'
import { Textarea } from '@play-money/ui/textarea'
import { toast } from '@play-money/ui/use-toast'

interface ResolutionDisputeButtonProps {
  marketId: string
  resolvedAt: Date | string
}

const DISPUTE_WINDOW_HOURS = 24

export function ResolutionDisputeButton({ marketId, resolvedAt }: ResolutionDisputeButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resolvedAtDate = new Date(resolvedAt)
  const windowEnd = new Date(resolvedAtDate.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000)
  const isWindowOpen = new Date() < windowEnd

  if (!isWindowOpen) return null

  const hoursRemaining = Math.max(0, (windowEnd.getTime() - Date.now()) / (1000 * 60 * 60))

  async function handleSubmit() {
    if (!reason.trim()) {
      toast({ title: 'Please provide a reason for the dispute', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      await flagMarketResolutionDispute({ marketId, reason: reason.trim() })
      await mutate(MARKET_RESOLUTION_DISPUTES_PATH(marketId))
      toast({ title: 'Dispute flagged successfully', description: 'Admins will review your dispute.' })
      setOpen(false)
      setReason('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to flag dispute'
      toast({ title: message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-warning border-warning/30 hover:bg-warning/10">
          <AlertTriangleIcon className="h-3.5 w-3.5" />
          Dispute resolution
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispute Market Resolution</DialogTitle>
          <DialogDescription>
            You have {hoursRemaining < 1 ? 'less than 1 hour' : `~${Math.floor(hoursRemaining)} hours`} remaining in
            the dispute window. Explain why you believe the resolution is incorrect.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="dispute-reason">Reason for dispute</Label>
          <Textarea
            id="dispute-reason"
            placeholder="Explain why this resolution is incorrect..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">{reason.length}/1000 characters</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? 'Submitting...' : 'Submit dispute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
