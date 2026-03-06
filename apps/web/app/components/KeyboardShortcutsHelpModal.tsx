'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@play-money/ui/dialog'

type ShortcutEntry = {
  key: string
  description: string
}

const SHORTCUTS: Array<{ group: string; shortcuts: Array<ShortcutEntry> }> = [
  {
    group: 'Navigation',
    shortcuts: [
      { key: '/', description: 'Open search' },
      { key: 'n', description: 'Open notifications' },
      { key: 'c', description: 'Create a market' },
      { key: '?', description: 'Show keyboard shortcuts' },
    ],
  },
  {
    group: 'Market List',
    shortcuts: [
      { key: '↓ / →', description: 'Next market' },
      { key: '↑ / ←', description: 'Previous market' },
    ],
  },
  {
    group: 'Search',
    shortcuts: [{ key: '⌘K', description: 'Open search (alternative)' }],
  },
]

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsHelpModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          {SHORTCUTS.map(({ group, shortcuts }) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
              <div className="space-y-2">
                {shortcuts.map(({ key, description }) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{description}</span>
                    <KbdKey>{key}</KbdKey>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
