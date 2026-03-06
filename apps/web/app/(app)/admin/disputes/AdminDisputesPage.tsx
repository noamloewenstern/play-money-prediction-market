'use client'

import { format } from 'date-fns'
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import useSWR from 'swr'
import { getAdminResolutionDisputes, adminReviewResolutionDispute } from '@play-money/api-helpers/client'
import type { ResolutionDisputeStatus } from '@play-money/api-helpers/client'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@play-money/ui/dialog'
import { Input } from '@play-money/ui/input'
import { Label } from '@play-money/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@play-money/ui/select'
import { Skeleton } from '@play-money/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@play-money/ui/table'
import { Textarea } from '@play-money/ui/textarea'
import { toast } from '@play-money/ui/use-toast'

const STATUS_BADGE_VARIANT: Record<ResolutionDisputeStatus, 'default' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  UNDER_REVIEW: 'default',
  OVERRIDDEN: 'success',
  REJECTED: 'secondary',
}

type AdminDispute = {
  id: string
  marketId: string
  marketResolutionId: string
  flaggedById: string
  reason: string
  status: ResolutionDisputeStatus
  reviewedById: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  flaggedBy: { id: string; username: string; displayName: string; avatarUrl: string | null }
  reviewedBy?: { id: string; username: string; displayName: string; avatarUrl: string | null } | null
  market: {
    id: string
    question: string
    slug: string
    resolvedAt: string | null
    marketResolution: {
      id: string
      resolutionId: string
      supportingLink: string | null
      resolution: { id: string; name: string; color: string }
      resolvedBy: { id: string; username: string; displayName: string }
    } | null
  }
}

export function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState<ResolutionDisputeStatus | 'ALL'>('PENDING')
  const [reviewDialog, setReviewDialog] = useState<{ dispute: AdminDispute; action: 'reject' | 'override' } | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [newOptionId, setNewOptionId] = useState('')
  const [newSupportingLink, setNewSupportingLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    `/v1/admin/markets/disputes?status=${statusFilter === 'ALL' ? '' : statusFilter}`,
    () => getAdminResolutionDisputes({ status: statusFilter === 'ALL' ? undefined : statusFilter })
  )

  async function handleReview() {
    if (!reviewDialog) return

    setIsSubmitting(true)
    try {
      await adminReviewResolutionDispute({
        marketId: reviewDialog.dispute.marketId,
        disputeId: reviewDialog.dispute.id,
        action: reviewDialog.action,
        reviewNote: reviewNote.trim() || undefined,
        newOptionId: reviewDialog.action === 'override' ? newOptionId : undefined,
        newSupportingLink: reviewDialog.action === 'override' ? newSupportingLink.trim() || undefined : undefined,
      })
      await mutate()
      toast({ title: `Dispute ${reviewDialog.action === 'reject' ? 'rejected' : 'overridden'} successfully` })
      setReviewDialog(null)
      setReviewNote('')
      setNewOptionId('')
      setNewSupportingLink('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to review dispute'
      toast({ title: message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const disputes = (data as unknown as { disputes: Array<AdminDispute> })?.disputes ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Resolution Disputes</h3>
          <p className="text-sm text-muted-foreground">Review flagged market resolution disputes from traders.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Label>Status filter</Label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ResolutionDisputeStatus | 'ALL')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="OVERRIDDEN">Overridden</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No disputes found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Flagged by</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.map((dispute) => (
              <TableRow key={dispute.id}>
                <TableCell className="max-w-xs">
                  <Link
                    href={`/questions/${dispute.market.id}/${dispute.market.slug}`}
                    className="text-sm font-medium hover:underline line-clamp-2"
                    target="_blank"
                  >
                    {dispute.market.question}
                  </Link>
                </TableCell>
                <TableCell>
                  {dispute.market.marketResolution ? (
                    <div className="text-sm">
                      <span
                        className="font-medium"
                        style={{ color: dispute.market.marketResolution.resolution.color }}
                      >
                        {dispute.market.marketResolution.resolution.name}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        by {dispute.market.marketResolution.resolvedBy.displayName}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">No resolution</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/admin/users/${dispute.flaggedBy.id}`} className="text-sm hover:underline">
                    {dispute.flaggedBy.displayName}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm line-clamp-2">{dispute.reason}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE_VARIANT[dispute.status]}>{dispute.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {(dispute.status === 'PENDING' || dispute.status === 'UNDER_REVIEW') ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => { setReviewDialog({ dispute, action: 'reject' }); setReviewNote('') }}
                      >
                        <XCircleIcon className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-success border-success/30 hover:bg-success/10"
                        onClick={() => {
                          setReviewDialog({ dispute, action: 'override' })
                          setReviewNote('')
                          setNewOptionId('')
                          setNewSupportingLink('')
                        }}
                      >
                        <CheckCircle2Icon className="h-3.5 w-3.5" />
                        Override
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {dispute.reviewedBy ? `Reviewed by ${dispute.reviewedBy.displayName}` : 'Reviewed'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog !== null} onOpenChange={(open) => { if (!open) setReviewDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.action === 'reject' ? 'Reject Dispute' : 'Override Resolution'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog?.action === 'reject'
                ? 'Reject this dispute. The original resolution will stand.'
                : 'Override the resolution with a new winning option. This will trigger re-settlement.'}
            </DialogDescription>
          </DialogHeader>

          {reviewDialog?.action === 'override' && reviewDialog.dispute.market.marketResolution ? (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">Current resolution:</p>
                <p style={{ color: reviewDialog.dispute.market.marketResolution.resolution.color }}>
                  {reviewDialog.dispute.market.marketResolution.resolution.name}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-option-id">New winning option ID *</Label>
                <Input
                  id="new-option-id"
                  placeholder="Option ID from the market"
                  value={newOptionId}
                  onChange={(e) => setNewOptionId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the ID of the option that should have won.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-supporting-link">New supporting link (optional)</Label>
                <Input
                  id="new-supporting-link"
                  placeholder="https://..."
                  value={newSupportingLink}
                  onChange={(e) => setNewSupportingLink(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="review-note">Review note (optional)</Label>
            <Textarea
              id="review-note"
              placeholder="Add a note explaining your decision..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={isSubmitting || (reviewDialog?.action === 'override' && !newOptionId)}
              variant={reviewDialog?.action === 'reject' ? 'destructive' : 'default'}
            >
              {isSubmitting
                ? 'Processing...'
                : reviewDialog?.action === 'reject'
                  ? 'Reject dispute'
                  : 'Override resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
