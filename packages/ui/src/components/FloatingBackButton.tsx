'use client'

import { ArrowLeftIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useNavigationHistory } from '../contexts/NavigationHistoryContext'

export function FloatingBackButton() {
  const router = useRouter()
  const { previousPage } = useNavigationHistory()

  if (!previousPage) {
    return null
  }

  return (
    <button
      onClick={() => router.back()}
      className="fixed bottom-6 left-6 z-30 flex items-center gap-2 rounded-full border bg-background/90 px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-soft-md backdrop-blur-md transition-all hover:bg-background hover:text-foreground hover:shadow-soft-lg"
      aria-label={`Back to ${previousPage.name}`}
    >
      <ArrowLeftIcon className="size-4" />
      <span className="max-w-[200px] truncate">Back to {previousPage.name}</span>
    </button>
  )
}
