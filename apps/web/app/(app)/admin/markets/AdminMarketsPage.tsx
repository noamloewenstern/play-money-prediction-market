'use client'

import { CircleDotIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import useSWR from 'swr'
import {
  getAdminMarkets,
  createMarketCancel,
  adminForceResolveMarket,
  adminBulkResolveMarkets,
} from '@play-money/api-helpers/client'
import type { AdminBulkOperation } from '@play-money/api-helpers/client'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Checkbox } from '@play-money/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from '@play-money/ui/use-toast'

type AdminMarket = {
  id: string
  question: string
  slug: string
  closeDate: string | null
  resolvedAt: string | null
  canceledAt: string | null
  createdBy: string
  commentCount: number | null
  uniqueTradersCount: number | null
  liquidityCount: number | null
  createdAt: string
  updatedAt: string
  options: Array<{ id: string; name: string; color: string }>
  user: { id: string; username: string; displayName: string }
}

function getMarketStatus(market: { resolvedAt: string | null; canceledAt: string | null }) {
  if (market.canceledAt) return 'canceled'
  if (market.resolvedAt) return 'resolved'
  return 'active'
}

export function AdminMarketsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [cancelTarget, setCancelTarget] = useState<{ id: string; question: string } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [resolveTarget, setResolveTarget] = useState<{ id: string; question: string } | null>(null)
  const [resolveOptionId, setResolveOptionId] = useState('')
  const [resolveReason, setResolveReason] = useState('')
  const [resolveSupportingLink, setResolveSupportingLink] = useState('')

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState<'cancel' | 'resolve' | null>(null)
  const [bulkCancelReason, setBulkCancelReason] = useState('')
  const [bulkResolveReason, setBulkResolveReason] = useState('')
  const [bulkResolveSupportingLink, setBulkResolveSupportingLink] = useState('')
  const [bulkResolveOptionMap, setBulkResolveOptionMap] = useState<Record<string, string>>({})
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const { data, mutate, isLoading } = useSWR(['admin-markets', search, statusFilter, page], () =>
    getAdminMarkets({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: 50,
    })
  )

  async function handleCancel() {
    if (!cancelTarget || !cancelReason.trim()) {
      toast({ title: 'Please provide a cancellation reason', variant: 'destructive' })
      return
    }
    try {
      await createMarketCancel({ marketId: cancelTarget.id, reason: cancelReason })
      toast({ title: 'Market canceled successfully' })
      void mutate()
      setCancelTarget(null)
      setCancelReason('')
    } catch (error) {
      toast({
        title: 'Failed to cancel market',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleForceResolve() {
    if (!resolveTarget || !resolveOptionId.trim()) {
      toast({ title: 'Please provide an option ID', variant: 'destructive' })
      return
    }
    try {
      await adminForceResolveMarket({
        marketId: resolveTarget.id,
        optionId: resolveOptionId,
        supportingLink: resolveSupportingLink || undefined,
        reason: resolveReason || undefined,
      })
      toast({ title: 'Market resolved successfully' })
      void mutate()
      setResolveTarget(null)
      setResolveOptionId('')
      setResolveReason('')
      setResolveSupportingLink('')
    } catch (error) {
      toast({
        title: 'Failed to resolve market',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const markets = data?.data ?? []
  const totalPages = data?.totalPages ?? 1
  const activeMarkets = markets.filter((m) => getMarketStatus(m) === 'active')
  const selectedActiveMarkets = activeMarkets.filter((m) => selectedIds.has(m.id))
  const allActiveSelected = activeMarkets.length > 0 && activeMarkets.every((m) => selectedIds.has(m.id))

  function toggleSelect(marketId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(marketId)) {
        next.delete(marketId)
      } else {
        next.add(marketId)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (allActiveSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(activeMarkets.map((m) => m.id)))
    }
  }

  function openBulkResolve() {
    const optionMap: Record<string, string> = {}
    for (const m of selectedActiveMarkets) {
      optionMap[m.id] = ''
    }
    setBulkResolveOptionMap(optionMap)
    setBulkResolveReason('')
    setBulkResolveSupportingLink('')
    setBulkMode('resolve')
  }

  function openBulkCancel() {
    setBulkCancelReason('')
    setBulkMode('cancel')
  }

  async function handleBulkCancel() {
    if (!bulkCancelReason.trim()) {
      toast({ title: 'Please provide a cancellation reason', variant: 'destructive' })
      return
    }

    setBulkProcessing(true)
    try {
      const operations: Array<AdminBulkOperation> = selectedActiveMarkets.map((m) => ({
        marketId: m.id,
        action: 'cancel' as const,
        reason: bulkCancelReason,
      }))

      const result = await adminBulkResolveMarkets({ operations })
      const { summary } = result?.data ?? { summary: { succeeded: 0, failed: 0 } }

      if (summary.failed === 0) {
        toast({ title: `Successfully canceled ${summary.succeeded} market(s)` })
      } else {
        toast({
          title: `Canceled ${summary.succeeded} market(s), ${summary.failed} failed`,
          variant: 'destructive',
        })
      }

      void mutate()
      setSelectedIds(new Set())
      setBulkMode(null)
      setBulkCancelReason('')
    } catch (error) {
      toast({
        title: 'Bulk cancel failed',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBulkProcessing(false)
    }
  }

  async function handleBulkResolve() {
    const missingOptions = selectedActiveMarkets.filter((m) => !bulkResolveOptionMap[m.id])
    if (missingOptions.length > 0) {
      toast({
        title: `Please select a winning option for all ${missingOptions.length} market(s)`,
        variant: 'destructive',
      })
      return
    }

    setBulkProcessing(true)
    try {
      const operations: Array<AdminBulkOperation> = selectedActiveMarkets.map((m) => ({
        marketId: m.id,
        action: 'resolve' as const,
        optionId: bulkResolveOptionMap[m.id],
        supportingLink: bulkResolveSupportingLink || undefined,
        reason: bulkResolveReason || undefined,
      }))

      const result = await adminBulkResolveMarkets({ operations })
      const { summary } = result?.data ?? { summary: { succeeded: 0, failed: 0 } }

      if (summary.failed === 0) {
        toast({ title: `Successfully resolved ${summary.succeeded} market(s)` })
      } else {
        toast({
          title: `Resolved ${summary.succeeded} market(s), ${summary.failed} failed`,
          variant: 'destructive',
        })
      }

      void mutate()
      setSelectedIds(new Set())
      setBulkMode(null)
      setBulkResolveOptionMap({})
      setBulkResolveReason('')
      setBulkResolveSupportingLink('')
    } catch (error) {
      toast({
        title: 'Bulk resolve failed',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBulkProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Market Moderation</h3>
        <p className="text-sm text-muted-foreground">View and moderate platform markets.</p>
      </div>

      <div className="flex gap-2">
        <Input
          className="max-w-sm"
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search markets..."
          value={search}
        />
        <Select
          onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          value={statusFilter}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedActiveMarkets.length > 0 ? (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selectedActiveMarkets.length} market(s) selected</span>
          <Button onClick={openBulkResolve} size="sm" variant="outline">
            Bulk Resolve
          </Button>
          <Button onClick={openBulkCancel} size="sm" variant="destructive">
            Bulk Cancel
          </Button>
          <Button
            className="ml-auto"
            onClick={() => { setSelectedIds(new Set()) }}
            size="sm"
            variant="ghost"
          >
            Clear selection
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead className="min-w-[250px]">Question</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Traders</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-14 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    {activeMarkets.length > 0 ? (
                      <Checkbox
                        checked={allActiveSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    ) : null}
                  </TableHead>
                  <TableHead className="min-w-[250px]">Question</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Traders</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markets.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-32" colSpan={8}>
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                          <CircleDotIcon className="size-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No markets found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  markets.map((market) => {
                    const status = getMarketStatus(market)
                    const isActive = status === 'active'
                    return (
                      <TableRow key={market.id}>
                        <TableCell>
                          {isActive ? (
                            <Checkbox
                              checked={selectedIds.has(market.id)}
                              onCheckedChange={() => { toggleSelect(market.id) }}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Link
                            className="font-medium hover:underline"
                            href={`/questions/${market.id}/${market.slug}`}
                          >
                            {market.question.length > 60
                              ? `${market.question.substring(0, 60)}...`
                              : market.question}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link className="text-sm hover:underline" href={`/${market.user.username}`}>
                            @{market.user.username}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === 'active' ? 'default' : status === 'resolved' ? 'secondary' : 'destructive'
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>{market.uniqueTradersCount ?? 0}</TableCell>
                        <TableCell>{market.commentCount ?? 0}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(market.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <div className="flex gap-1">
                              <Button
                                onClick={() => { setResolveTarget({ id: market.id, question: market.question }) }}
                                size="sm"
                                variant="outline"
                              >
                                Resolve
                              </Button>
                              <Button
                                onClick={() => { setCancelTarget({ id: market.id, question: market.question }) }}
                                size="sm"
                                variant="destructive"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({data?.total} total markets)
              </div>
              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => { setPage(page - 1) }} size="sm" variant="outline">
                  Previous
                </Button>
                <Button disabled={page >= totalPages} onClick={() => { setPage(page + 1) }} size="sm" variant="outline">
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Single Cancel Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null)
            setCancelReason('')
          }
        }}
        open={Boolean(cancelTarget)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Market</DialogTitle>
            <DialogDescription>
              Cancel &quot;{cancelTarget?.question}&quot;. This will reverse all trades and return funds to traders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              onChange={(e) => { setCancelReason(e.target.value) }}
              placeholder="Reason for cancellation..."
              value={cancelReason}
            />
            <Button
              onClick={() => { void handleCancel() }}
              variant="destructive"
            >
              Cancel Market
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Resolve Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null)
            setResolveOptionId('')
            setResolveReason('')
            setResolveSupportingLink('')
          }
        }}
        open={Boolean(resolveTarget)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Resolve Market</DialogTitle>
            <DialogDescription>
              Resolve &quot;{resolveTarget?.question}&quot;. This will settle all positions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              onChange={(e) => { setResolveOptionId(e.target.value) }}
              placeholder="Winning option ID..."
              value={resolveOptionId}
            />
            <Input
              onChange={(e) => { setResolveSupportingLink(e.target.value) }}
              placeholder="Supporting link (optional)..."
              value={resolveSupportingLink}
            />
            <Input
              onChange={(e) => { setResolveReason(e.target.value) }}
              placeholder="Reason for resolution..."
              value={resolveReason}
            />
            <Button onClick={() => { void handleForceResolve() }}>
              Resolve Market
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Cancel Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setBulkMode(null)
            setBulkCancelReason('')
          }
        }}
        open={bulkMode === 'cancel'}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Cancel Markets</DialogTitle>
            <DialogDescription>
              Cancel {selectedActiveMarkets.length} selected market(s). This will reverse all trades and return funds
              to traders for each market.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[200px] overflow-y-auto rounded-md border p-2">
              <ul className="space-y-1">
                {selectedActiveMarkets.map((m) => (
                  <li className="text-sm" key={m.id}>
                    {m.question.length > 80 ? `${m.question.substring(0, 80)}...` : m.question}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <Label>Reason for cancellation (applies to all)</Label>
              <Input
                onChange={(e) => { setBulkCancelReason(e.target.value) }}
                placeholder="Reason for cancellation..."
                value={bulkCancelReason}
              />
            </div>
            <Button
              disabled={bulkProcessing}
              onClick={() => { void handleBulkCancel() }}
              variant="destructive"
            >
              {bulkProcessing ? 'Processing...' : `Cancel ${selectedActiveMarkets.length} Market(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Resolve Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setBulkMode(null)
            setBulkResolveOptionMap({})
            setBulkResolveReason('')
            setBulkResolveSupportingLink('')
          }
        }}
        open={bulkMode === 'resolve'}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Resolve Markets</DialogTitle>
            <DialogDescription>
              Resolve {selectedActiveMarkets.length} selected market(s). Select the winning option for each market.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-md border p-3">
              {selectedActiveMarkets.map((market) => (
                <div className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0" key={market.id}>
                  <div className="text-sm font-medium">
                    {market.question.length > 80 ? `${market.question.substring(0, 80)}...` : market.question}
                  </div>
                  <Select
                    onValueChange={(value) => {
                      setBulkResolveOptionMap((prev) => ({ ...prev, [market.id]: value }))
                    }}
                    value={bulkResolveOptionMap[market.id] || ''}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select winning option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {market.options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: option.color }}
                            />
                            {option.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Supporting link (optional, applies to all)</Label>
              <Input
                onChange={(e) => { setBulkResolveSupportingLink(e.target.value) }}
                placeholder="Supporting link..."
                value={bulkResolveSupportingLink}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional, applies to all)</Label>
              <Input
                onChange={(e) => { setBulkResolveReason(e.target.value) }}
                placeholder="Reason for resolution..."
                value={bulkResolveReason}
              />
            </div>
            <Button
              disabled={bulkProcessing}
              onClick={() => { void handleBulkResolve() }}
            >
              {bulkProcessing ? 'Processing...' : `Resolve ${selectedActiveMarkets.length} Market(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
