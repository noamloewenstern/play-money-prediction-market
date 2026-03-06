'use client'

import React from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

export function DraftRecoveryBanner({
  onRestore,
  onDiscard,
  className,
  preview,
}: {
  onRestore: () => void
  onDiscard: () => void
  className?: string
  preview?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-800 dark:bg-blue-950',
        className
      )}
    >
      <span className="flex-1 truncate text-muted-foreground">
        {preview ? (
          <>
            Unsaved draft found: <span className="italic">&quot;{preview}&quot;</span>
          </>
        ) : (
          'Unsaved draft found'
        )}
      </span>
      <Button variant="ghost" size="sm" onClick={onRestore}>
        Restore
      </Button>
      <Button variant="ghost" size="sm" onClick={onDiscard}>
        Discard
      </Button>
    </div>
  )
}
