'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type ActionState = 'idle' | 'loading' | 'success' | 'error'

const SUCCESS_DURATION = 1500
const ERROR_DURATION = 500

export function useStatefulAction(options?: {
  successDuration?: number
  errorDuration?: number
}) {
  const [actionState, setActionState] = useState<ActionState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  const setLoading = useCallback(() => {
    clearTimer()
    setActionState('loading')
  }, [clearTimer])

  const setSuccess = useCallback(() => {
    setActionState('success')
    timerRef.current = setTimeout(() => {
      setActionState('idle')
    }, options?.successDuration ?? SUCCESS_DURATION)
  }, [options?.successDuration])

  const setError = useCallback(() => {
    setActionState('error')
    timerRef.current = setTimeout(() => {
      setActionState('idle')
    }, options?.errorDuration ?? ERROR_DURATION)
  }, [options?.errorDuration])

  const reset = useCallback(() => {
    clearTimer()
    setActionState('idle')
  }, [clearTimer])

  return { actionState, setLoading, setSuccess, setError, reset }
}
