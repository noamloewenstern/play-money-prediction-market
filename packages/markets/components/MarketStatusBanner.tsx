'use client'

import { formatDistanceToNowStrict, differenceInHours, isPast, format } from 'date-fns'
import { Clock, CheckCircle2, AlertTriangle, Timer, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { ExtendedMarket } from '../types'

type MarketStatus = 'active' | 'closing-soon' | 'closed' | 'resolved' | 'canceled'

function getMarketStatus(market: ExtendedMarket): MarketStatus {
  if (market.canceledAt) return 'canceled'
  if (market.resolvedAt || market.marketResolution) return 'resolved'
  if (market.closeDate) {
    const closeDate = new Date(market.closeDate)
    if (isPast(closeDate)) return 'closed'
    if (differenceInHours(closeDate, new Date()) < 24) return 'closing-soon'
  }
  return 'active'
}

const statusConfig = {
  active: {
    icon: Clock,
    className: 'border-success/30 bg-success/10 text-foreground',
    iconClassName: 'text-success',
  },
  'closing-soon': {
    icon: Timer,
    className: 'border-warning/30 bg-warning/10 text-foreground',
    iconClassName: 'text-warning',
  },
  closed: {
    icon: AlertTriangle,
    className: 'border-warning/30 bg-warning/10 text-foreground',
    iconClassName: 'text-warning',
  },
  resolved: {
    icon: CheckCircle2,
    className: 'border-info/30 bg-info/10 text-foreground',
    iconClassName: 'text-info',
  },
  canceled: {
    icon: XCircle,
    className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    iconClassName: 'text-muted-foreground',
  },
}

function useTimeRemaining(closeDate: Date | string | null | undefined) {
  const [remaining, setRemaining] = useState(() =>
    closeDate ? formatDistanceToNowStrict(new Date(closeDate), { addSuffix: true }) : ''
  )

  useEffect(() => {
    if (!closeDate) return

    const target = new Date(closeDate)
    const hoursLeft = differenceInHours(target, new Date())
    // Update every second if < 1 hour, every minute if < 24h, otherwise every minute
    const interval = hoursLeft < 1 ? 1000 : 60_000

    const timer = setInterval(() => {
      setRemaining(formatDistanceToNowStrict(target, { addSuffix: true }))
    }, interval)

    return () => clearInterval(timer)
  }, [closeDate])

  return remaining
}

export function MarketStatusBanner({ market }: { market: ExtendedMarket }) {
  const status = getMarketStatus(market)
  const config = statusConfig[status]
  const Icon = config.icon
  const timeRemaining = useTimeRemaining(market.closeDate)

  const renderContent = () => {
    switch (status) {
      case 'active': {
        if (!market.closeDate) return null
        return (
          <>
            <span className="font-semibold">Active</span>
            <span className="mx-1.5">&middot;</span>
            <span>Closes {timeRemaining}</span>
          </>
        )
      }
      case 'closing-soon':
        return (
          <>
            <span className="font-semibold">Closing Soon</span>
            <span className="mx-1.5">&middot;</span>
            <span>Closes {timeRemaining}</span>
          </>
        )
      case 'closed':
        return (
          <>
            <span className="font-semibold">Awaiting Resolution</span>
            <span className="mx-1.5">&middot;</span>
            <span>Closed {timeRemaining}</span>
          </>
        )
      case 'resolved': {
        const resolution = market.marketResolution
        return (
          <>
            <span className="font-semibold">Resolved</span>
            {resolution ? (
              <>
                <span className="mx-1.5">&middot;</span>
                <span
                  className="font-semibold"
                  style={{ color: resolution.resolution.color }}
                >
                  {resolution.resolution.name}
                </span>
                <span className="mx-1.5">&middot;</span>
                <span>{format(new Date(resolution.updatedAt), 'MMM d, yyyy')}</span>
              </>
            ) : null}
          </>
        )
      }
      case 'canceled':
        return <span className="font-semibold">Canceled</span>
      default:
        return null
    }
  }

  // Don't show banner for active markets with no close date
  if (status === 'active' && !market.closeDate) return null

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${config.className}`}
      data-testid="market-status-banner"
      data-status={status}
    >
      <Icon className={`size-4 flex-shrink-0 ${config.iconClassName}`} />
      <div className="flex flex-wrap items-center gap-y-0.5">
        {renderContent()}
      </div>
    </div>
  )
}
