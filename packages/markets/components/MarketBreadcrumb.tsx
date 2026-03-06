'use client'

import truncate from 'lodash/truncate'
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@play-money/ui/sheet'
import { ExtendedMarket } from '../types'

function BreadcrumbSegment({ segment }: { segment: BreadcrumbSegmentType }) {
  return segment.href ? (
    <Link href={segment.href} className="truncate hover:text-foreground">
      {segment.label}
    </Link>
  ) : (
    <span className="truncate text-foreground">{segment.label}</span>
  )
}

export function MarketBreadcrumb({ market }: { market: ExtendedMarket }) {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const [sheetOpen, setSheetOpen] = useState(false)

  const segments = buildBreadcrumbSegments(market, ref)
  const hasMiddleSegments = segments.length > 1
  const lastSegment = segments[segments.length - 1]

  return (
    <>
      {/* Desktop: full breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
        <Link href="/" className="flex items-center hover:text-foreground">
          <Home className="size-3.5" />
        </Link>
        {segments.map((segment) => (
          <React.Fragment key={segment.label}>
            <ChevronRight className="size-3 flex-shrink-0" />
            <BreadcrumbSegment segment={segment} />
          </React.Fragment>
        ))}
      </nav>

      {/* Mobile: collapsed breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground md:hidden">
        <Link href="/" className="flex items-center hover:text-foreground">
          <Home className="size-3.5" />
        </Link>
        {hasMiddleSegments ? (
          <>
            <ChevronRight className="size-3 flex-shrink-0" />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex items-center rounded-md px-1 hover:bg-muted hover:text-foreground"
              aria-label="Show full breadcrumb path"
            >
              <MoreHorizontal className="size-4" />
            </button>
            <ChevronRight className="size-3 flex-shrink-0" />
            <BreadcrumbSegment segment={lastSegment} />
          </>
        ) : (
          <>
            <ChevronRight className="size-3 flex-shrink-0" />
            <BreadcrumbSegment segment={lastSegment} />
          </>
        )}
      </nav>

      {/* Bottom sheet for mobile breadcrumb expansion */}
      {hasMiddleSegments ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-3 py-4" aria-label="Full breadcrumb path">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setSheetOpen(false)}
              >
                <Home className="size-4" />
                Home
              </Link>
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2 pl-4 text-sm">
                  <ChevronRight className="size-3 flex-shrink-0 text-muted-foreground" />
                  {segment.href ? (
                    <Link
                      href={segment.href}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setSheetOpen(false)}
                    >
                      {segment.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{segment.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}

type BreadcrumbSegmentType = {
  label: string
  href?: string
}

function buildBreadcrumbSegments(market: ExtendedMarket, ref: string | null): Array<BreadcrumbSegmentType> {
  const marketLabel = truncate(market.question, { length: 50 })

  if (ref) {
    const [type, ...valueParts] = ref.split(':')
    const value = valueParts.join(':')

    if (type === 'tag' && value) {
      return [
        { label: value, href: `/questions/tagged/${encodeURIComponent(value)}` },
        { label: marketLabel },
      ]
    }

    if (type === 'list' && value && market.parentList) {
      return [
        { label: market.parentList.title, href: `/lists/${market.parentList.id}/${market.parentList.slug}` },
        { label: marketLabel },
      ]
    }
  }

  // Fallback: use parentList if available, otherwise first tag
  if (market.parentList) {
    return [
      { label: market.parentList.title, href: `/lists/${market.parentList.id}/${market.parentList.slug}` },
      { label: marketLabel },
    ]
  }

  if (market.tags.length > 0) {
    return [
      { label: market.tags[0], href: `/questions/tagged/${encodeURIComponent(market.tags[0])}` },
      { label: marketLabel },
    ]
  }

  return [{ label: marketLabel }]
}
