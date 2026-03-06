'use client'

import { WifiOffIcon, XIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useConnectionStatus } from '../contexts/ConnectionStatusContext'

export function OfflineBanner() {
  const { isOnline } = useConnectionStatus()
  const [dismissed, setDismissed] = useState(false)
  const prevOnlineRef = useRef(isOnline)

  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      setDismissed(false)
    }
    prevOnlineRef.current = isOnline
  }, [isOnline])

  if (isOnline || dismissed) {
    return null
  }

  return (
    <div
      role="alert"
      className="flex w-full items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning"
    >
      <div className="flex items-center gap-2">
        <WifiOffIcon className="size-4 shrink-0" />
        <span>You&apos;re offline &mdash; changes will sync when reconnected</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-warning/20"
        aria-label="Dismiss offline notification"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  )
}
