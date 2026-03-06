'use client'

import {
  ChevronDownIcon,
  ClockIcon,
  HomeIcon,
  ListIcon,
  PlusCircleIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  TrendingUpIcon,
  TrophyIcon,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { cn } from '../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

const MAX_HISTORY = 8

type PageInfo = {
  type: string
  label: string
  path: string
  icon: React.ElementType
}

function getPageInfo(pathname: string): PageInfo {
  if (pathname === '/') {
    return { type: 'Home', label: 'Home', path: '/', icon: HomeIcon }
  }

  if (pathname === '/questions') {
    return { type: 'Questions', label: 'Questions', path: pathname, icon: TrendingUpIcon }
  }

  if (pathname === '/questions/following') {
    return { type: 'Questions', label: 'Following', path: pathname, icon: TrendingUpIcon }
  }

  if (pathname === '/questions/bookmarks') {
    return { type: 'Questions', label: 'Bookmarks', path: pathname, icon: TrendingUpIcon }
  }

  if (pathname.startsWith('/questions/tagged/')) {
    const tag = decodeURIComponent(pathname.split('/questions/tagged/')[1] || '')
    return { type: 'Tag', label: truncateLabel(tag), path: pathname, icon: TagIcon }
  }

  if (pathname.startsWith('/questions/')) {
    const parts = pathname.split('/')
    const slug = parts[3] || parts[2] || ''
    const label = slug.replace(/-/g, ' ')
    return { type: 'Market', label: truncateLabel(label), path: pathname, icon: TrendingUpIcon }
  }

  if (pathname.startsWith('/lists/')) {
    const parts = pathname.split('/')
    const slug = parts[3] || ''
    const label = slug.replace(/-/g, ' ')
    return { type: 'List', label: truncateLabel(label), path: pathname, icon: ListIcon }
  }

  if (pathname === '/leaderboard' || pathname.startsWith('/leaderboard/')) {
    return { type: 'Leaderboard', label: 'Leaderboard', path: pathname, icon: TrophyIcon }
  }

  if (pathname === '/create-post') {
    return { type: 'Create', label: 'Create', path: pathname, icon: PlusCircleIcon }
  }

  if (pathname.startsWith('/settings')) {
    return { type: 'Settings', label: 'Settings', path: pathname, icon: SettingsIcon }
  }

  if (pathname.startsWith('/admin')) {
    return { type: 'Admin', label: 'Admin', path: pathname, icon: ShieldIcon }
  }

  // User profile: /[username]
  const usernameMatch = pathname.match(/^\/([^/]+)$/)
  if (usernameMatch) {
    return { type: 'Profile', label: truncateLabel(usernameMatch[1]), path: pathname, icon: UserIcon }
  }

  return { type: 'Page', label: truncateLabel(pathname.slice(1)), path: pathname, icon: HomeIcon }
}

function truncateLabel(label: string, maxLen = 20): string {
  if (label.length <= maxLen) return label
  return label.slice(0, maxLen - 1) + '\u2026'
}

function getHistory(): Array<PageInfo> {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem('pm-nav-history')
    return raw ? (JSON.parse(raw) as Array<PageInfo>) : []
  } catch {
    return []
  }
}

function saveHistory(history: Array<PageInfo>) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem('pm-nav-history', JSON.stringify(history))
  } catch {
    // ignore
  }
}

export function LocationChip({ className }: { className?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [history, setHistory] = React.useState<Array<PageInfo>>([])

  const current = React.useMemo(() => getPageInfo(pathname), [pathname])

  React.useEffect(() => {
    const prev = getHistory()
    // Remove duplicate paths, add current to front
    const updated = [current, ...prev.filter((h) => h.path !== current.path)].slice(0, MAX_HISTORY)
    saveHistory(updated)
    setHistory(updated)
  }, [current.path]) // eslint-disable-line react-hooks/exhaustive-deps

  const pastHistory = history.filter((h) => h.path !== current.path)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted',
            'max-w-[200px]',
            className
          )}
          aria-label="Current location and recent pages"
          data-testid="location-chip"
        >
          <current.icon className="size-3 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">
            {current.type !== current.label ? (
              <>
                {current.type}
                <span className="mx-1 text-muted-foreground">&middot;</span>
                {current.label}
              </>
            ) : (
              current.label
            )}
          </span>
          <ChevronDownIcon className="size-3 flex-shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0" sideOffset={8}>
        <div className="border-b px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Current page</p>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium">
            <current.icon className="size-3.5 text-muted-foreground" />
            <span className="truncate">{current.type !== current.label ? `${current.type} · ${current.label}` : current.label}</span>
          </div>
        </div>

        {pastHistory.length > 0 ? (
          <div className="py-1">
            <p className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ClockIcon className="size-3" />
              Recent
            </p>
            {pastHistory.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <Icon className="size-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {item.type !== item.label ? `${item.type} · ${item.label}` : item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">No recent pages yet</div>
        )}
      </PopoverContent>
    </Popover>
  )
}
