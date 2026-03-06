'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker on first mount (client-only).
 * Rendered in the root layout so it runs on every page.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates on each page load
        registration.update().catch(() => undefined)
      })
      .catch(() => {
        // SW registration failure is non-fatal — app continues to work normally
      })
  }, [])

  return null
}
