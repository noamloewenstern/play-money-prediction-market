'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'
import { useLocalStorage } from '@play-money/ui'
import { Button } from '@play-money/ui/button'
import { cn } from '@play-money/ui/utils'
import { useUser } from '@play-money/users/context/UserContext'

const WALKTHROUGH_STEPS = [
  {
    target: 'probability',
    title: 'Market Probability',
    description: 'This shows the current crowd estimate. A higher percentage means the crowd thinks this outcome is more likely.',
    position: 'bottom' as const,
  },
  {
    target: 'trade-panel',
    title: 'Buy & Sell Panel',
    description: 'This is where you place trades. Pick an outcome you believe in, then buy shares. If you are right, each share pays out more than you paid.',
    position: 'left' as const,
  },
  {
    target: 'amount-input',
    title: 'Share Amount',
    description: 'Enter how much you want to spend. Start small — you can always buy more later. Use the quick-add buttons to increase your amount.',
    position: 'left' as const,
  },
  {
    target: 'positions-tab',
    title: 'Your Positions',
    description: 'After trading, check this tab to see all the shares you hold and their current value.',
    position: 'bottom' as const,
  },
]

type Position = 'top' | 'bottom' | 'left' | 'right'

function getTooltipStyle(rect: DOMRect, position: Position, tooltipRect: DOMRect | null) {
  const gap = 12
  const tooltipWidth = tooltipRect?.width ?? 280
  const tooltipHeight = tooltipRect?.height ?? 120

  let top = 0
  let left = 0

  switch (position) {
    case 'bottom':
      top = rect.bottom + gap + window.scrollY
      left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX
      break
    case 'top':
      top = rect.top - tooltipHeight - gap + window.scrollY
      left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX
      break
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY
      left = rect.left - tooltipWidth - gap + window.scrollX
      break
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY
      left = rect.right + gap + window.scrollX
      break
  }

  // Clamp horizontally
  left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8))
  // Clamp vertically
  top = Math.max(8 + window.scrollY, top)

  return { top, left }
}

function getHighlightStyle(rect: DOMRect) {
  return {
    top: rect.top + window.scrollY - 4,
    left: rect.left + window.scrollX - 4,
    width: rect.width + 8,
    height: rect.height + 8,
  }
}

export function MarketWalkthrough() {
  const { user } = useUser()
  const [dismissed, setDismissed] = useLocalStorage('market-walkthrough-dismissed', false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null)

  const step = WALKTHROUGH_STEPS[currentStep]

  const findTarget = useCallback(() => {
    if (!step) return null
    return document.querySelector(`[data-walkthrough="${step.target}"]`)
  }, [step])

  const updatePosition = useCallback(() => {
    const el = findTarget()
    if (!el) {
      setTargetRect(null)
      return
    }
    setTargetRect(el.getBoundingClientRect())
  }, [findTarget])

  // Wait for target elements to appear in DOM
  useEffect(() => {
    if (dismissed || !user) return

    // Poll for the target element (may not be rendered yet on initial mount)
    let attempts = 0
    const maxAttempts = 20
    const interval = setInterval(() => {
      const el = findTarget()
      if (el) {
        clearInterval(interval)
        setTargetRect(el.getBoundingClientRect())
        // Small delay so the page settles
        setTimeout(() => setVisible(true), 300)
      }
      attempts++
      if (attempts >= maxAttempts) {
        clearInterval(interval)
      }
    }, 250)

    return () => clearInterval(interval)
  }, [dismissed, user, currentStep, findTarget])

  // Update position on scroll/resize
  useEffect(() => {
    if (!visible) return
    const handler = () => updatePosition()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [visible, updatePosition])

  // Measure tooltip after render
  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipRect(tooltipRef.current.getBoundingClientRect())
    }
  }, [currentStep, visible, targetRect])

  const dismiss = useCallback(() => {
    setVisible(false)
    setDismissed(true)
  }, [setDismissed])

  const next = useCallback(() => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setVisible(false)
      setCurrentStep((s) => s + 1)
    } else {
      dismiss()
    }
  }, [currentStep, dismiss])

  // Scroll target into view when step changes
  useEffect(() => {
    if (!visible || !targetRect) return
    const el = findTarget()
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Re-measure after scroll
      setTimeout(updatePosition, 400)
    }
  }, [currentStep, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed || !user || !visible || !targetRect || !step) return null

  const tooltipStyle = getTooltipStyle(targetRect, step.position, tooltipRect)
  const highlightStyle = getHighlightStyle(targetRect)

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300"
        onClick={dismiss}
        aria-hidden
      />

      {/* Highlight cutout */}
      <div
        className="pointer-events-none absolute z-[101] rounded-lg ring-2 ring-primary shadow-lg"
        style={highlightStyle}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'absolute z-[102] w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={{ top: tooltipStyle.top, left: tooltipStyle.left }}
        role="dialog"
        aria-label={step.title}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold">{step.title}</h4>
          <button
            type="button"
            onClick={dismiss}
            className="mt-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss walkthrough"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {WALKTHROUGH_STEPS.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={dismiss}>
              Skip
            </Button>
            <Button size="sm" className="h-7 px-3 text-xs" onClick={next}>
              {currentStep === WALKTHROUGH_STEPS.length - 1 ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
