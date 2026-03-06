'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

function formatSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function URLBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname()

  if (!pathname || pathname === '/') {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="flex items-center hover:text-foreground">
            <Home className="size-3.5" />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const isLast = index === segments.length - 1
          const label = formatSegment(segment)

          return (
            <React.Fragment key={href}>
              <li aria-hidden="true">
                <ChevronRight className="size-3 flex-shrink-0" />
              </li>
              <li className="min-w-0">
                {isLast ? (
                  <span className="truncate text-foreground">{label}</span>
                ) : (
                  <Link href={href} className="truncate hover:text-foreground">
                    {label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
