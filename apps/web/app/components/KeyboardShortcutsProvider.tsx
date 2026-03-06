'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyboardShortcutsHelpModal } from './KeyboardShortcutsHelpModal'

function isEditingTarget(target: EventTarget | null): boolean {
  if (!target) return false
  const el = target as HTMLElement
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function KeyboardShortcutsProvider() {
  const router = useRouter()
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in a field
      if (isEditingTarget(e.target)) return
      // Don't fire when modifier keys are held (except Shift for '?')
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case '/': {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('keyboard:search'))
          break
        }
        case 'n': {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('keyboard:notifications'))
          break
        }
        case 'c': {
          e.preventDefault()
          router.push('/create-post')
          break
        }
        case '?': {
          e.preventDefault()
          setIsHelpOpen((prev) => !prev)
          break
        }
        case 'ArrowDown':
        case 'ArrowRight': {
          const links = Array.from(document.querySelectorAll<HTMLElement>('[data-market-link]'))
          if (!links.length) return
          const focused = document.activeElement as HTMLElement
          const idx = links.indexOf(focused)
          if (idx === -1) {
            e.preventDefault()
            links[0].focus()
          } else if (idx < links.length - 1) {
            e.preventDefault()
            links[idx + 1].focus()
          }
          break
        }
        case 'ArrowUp':
        case 'ArrowLeft': {
          const links = Array.from(document.querySelectorAll<HTMLElement>('[data-market-link]'))
          if (!links.length) return
          const focused = document.activeElement as HTMLElement
          const idx = links.indexOf(focused)
          if (idx > 0) {
            e.preventDefault()
            links[idx - 1].focus()
          }
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return <KeyboardShortcutsHelpModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />
}
