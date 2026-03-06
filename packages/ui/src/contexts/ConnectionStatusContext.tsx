'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type ConnectionStatusContextProps = {
  isOnline: boolean
}

const ConnectionStatusContext = createContext<ConnectionStatusContextProps>({
  isOnline: true,
})

const API_HEALTH_CHECK_INTERVAL = 30_000

export function ConnectionStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkApiReachable = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })
      setIsOnline(response.ok)
    } catch {
      setIsOnline(false)
    }
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    intervalRef.current = setInterval(checkApiReachable, API_HEALTH_CHECK_INTERVAL)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkApiReachable])

  return <ConnectionStatusContext.Provider value={{ isOnline }}>{children}</ConnectionStatusContext.Provider>
}

export function useConnectionStatus(): ConnectionStatusContextProps {
  return useContext(ConnectionStatusContext)
}
