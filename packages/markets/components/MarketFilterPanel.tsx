'use client'

import { FilterIcon, XIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Input } from '@play-money/ui/input'
import { Label } from '@play-money/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@play-money/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@play-money/ui/select'

type FilterValues = {
  status?: string
  marketType?: string
  minTraders?: string
  maxTraders?: string
  minLiquidity?: string
  maxLiquidity?: string
  closeDateMin?: string
  closeDateMax?: string
  tags?: string
}

const FILTER_KEYS: Array<keyof FilterValues> = [
  'status',
  'marketType',
  'minTraders',
  'maxTraders',
  'minLiquidity',
  'maxLiquidity',
  'closeDateMin',
  'closeDateMax',
  'tags',
]

function formatDateForInput(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

function getActiveFilterCount(params: URLSearchParams): number {
  let count = 0
  for (const key of FILTER_KEYS) {
    if (key === 'status') continue
    if (params.get(key)) count++
  }
  return count
}

function getActiveFilterLabels(params: URLSearchParams): Array<string> {
  const labels: Array<string> = []
  const marketType = params.get('marketType')
  if (marketType) labels.push(marketType === 'binary' ? 'Binary' : 'Multi-option')
  if (params.get('minTraders') || params.get('maxTraders')) labels.push('Traders')
  if (params.get('minLiquidity') || params.get('maxLiquidity')) labels.push('Liquidity')
  if (params.get('closeDateMin') || params.get('closeDateMax')) labels.push('Close date')
  if (params.get('tags')) labels.push('Tags')
  return labels
}

export function MarketFilterPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          current.delete(key)
        } else {
          current.set(key, value)
        }
      }
      current.delete('cursor')
      const query = current.toString()
      router.push(`${pathname}${query ? `?${query}` : ''}`)
    },
    [router, pathname, searchParams]
  )

  const clearAllFilters = useCallback(() => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    for (const key of FILTER_KEYS) {
      current.delete(key)
    }
    current.delete('cursor')
    const query = current.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }, [router, pathname, searchParams])

  const activeCount = useMemo(() => getActiveFilterCount(searchParams), [searchParams])
  const activeLabels = useMemo(() => getActiveFilterLabels(searchParams), [searchParams])

  const status = searchParams.get('status') || 'active'
  const marketType = searchParams.get('marketType') || ''
  const minTraders = searchParams.get('minTraders') || ''
  const maxTraders = searchParams.get('maxTraders') || ''
  const minLiquidity = searchParams.get('minLiquidity') || ''
  const maxLiquidity = searchParams.get('maxLiquidity') || ''
  const closeDateMin = searchParams.get('closeDateMin') ? formatDateForInput(searchParams.get('closeDateMin')!) : ''
  const closeDateMax = searchParams.get('closeDateMax') ? formatDateForInput(searchParams.get('closeDateMax')!) : ''
  const tags = searchParams.get('tags') || ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={status}
        onValueChange={(value) => {
          updateParams({ status: value === 'active' ? undefined : value })
        }}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Status</SelectLabel>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 gap-1.5">
            <FilterIcon className="h-4 w-4" />
            Filters
            {activeCount > 0 ? (
              <Badge variant="default" className="ml-0.5 h-5 min-w-5 justify-center px-1.5">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Filters</h4>
              {activeCount > 0 ? (
                <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={clearAllFilters}>
                  Clear all
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Market type</Label>
              <Select
                value={marketType || '_all'}
                onValueChange={(value) => {
                  updateParams({ marketType: value === '_all' ? undefined : value })
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Any</SelectItem>
                  <SelectItem value="binary">Binary (Yes/No)</SelectItem>
                  <SelectItem value="multi">Multi-option</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Traders</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  className="h-9"
                  min={0}
                  value={minTraders}
                  onChange={(e) => updateParams({ minTraders: e.target.value || undefined })}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="h-9"
                  min={0}
                  value={maxTraders}
                  onChange={(e) => updateParams({ maxTraders: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Liquidity</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  className="h-9"
                  min={0}
                  value={minLiquidity}
                  onChange={(e) => updateParams({ minLiquidity: e.target.value || undefined })}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="h-9"
                  min={0}
                  value={maxLiquidity}
                  onChange={(e) => updateParams({ maxLiquidity: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Close date range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="h-9"
                  value={closeDateMin}
                  onChange={(e) => updateParams({ closeDateMin: e.target.value || undefined })}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  className="h-9"
                  value={closeDateMax}
                  onChange={(e) => updateParams({ closeDateMax: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
              <Input
                type="text"
                placeholder="e.g. politics,technology"
                className="h-9"
                value={tags}
                onChange={(e) => updateParams({ tags: e.target.value || undefined })}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeLabels.map((label) => (
        <Badge key={label} variant="secondary" className="gap-1">
          {label}
          <button
            type="button"
            className="ml-0.5 rounded-full hover:bg-muted"
            onClick={() => {
              const removals: Record<string, undefined> = {}
              if (label === 'Binary' || label === 'Multi-option') removals.marketType = undefined
              if (label === 'Traders') {
                removals.minTraders = undefined
                removals.maxTraders = undefined
              }
              if (label === 'Liquidity') {
                removals.minLiquidity = undefined
                removals.maxLiquidity = undefined
              }
              if (label === 'Close date') {
                removals.closeDateMin = undefined
                removals.closeDateMax = undefined
              }
              if (label === 'Tags') removals.tags = undefined
              updateParams(removals)
            }}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
