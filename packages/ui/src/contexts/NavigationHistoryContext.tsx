'use client'

import { usePathname } from 'next/navigation'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

type PageEntry = {
  path: string
  name: string
  type: 'home' | 'question' | 'profile' | 'list' | 'tag' | 'leaderboard' | 'settings' | 'admin' | 'create' | 'other'
}

type NavigationHistoryContextProps = {
  previousPage: PageEntry | null
  recentPages: Array<PageEntry>
}

const MAX_RECENT_PAGES = 5

const NavigationHistoryContext = createContext<NavigationHistoryContextProps>({
  previousPage: null,
  recentPages: [],
})

function getPageType(pathname: string): PageEntry['type'] {
  if (pathname === '/') return 'home'
  if (pathname === '/questions' || pathname === '/questions/following' || pathname === '/questions/bookmarks')
    return 'question'
  if (pathname === '/create-post') return 'create'
  if (pathname.startsWith('/leaderboard')) return 'leaderboard'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/questions/tagged/')) return 'tag'
  if (/^\/questions\/[^/]+\/[^/]+/.test(pathname)) return 'question'
  if (/^\/lists\/[^/]+/.test(pathname)) return 'list'

  const knownTopLevel = ['/questions', '/leaderboard', '/create-post', '/settings', '/admin', '/lists']
  if (/^\/[^/]+$/.test(pathname) && !knownTopLevel.some((r) => pathname === r)) {
    return 'profile'
  }

  return 'other'
}

function getPageName(pathname: string): string {
  if (pathname === '/') return 'Home'
  if (pathname === '/questions') return 'Questions'
  if (pathname === '/questions/following') return 'Following'
  if (pathname === '/questions/bookmarks') return 'Bookmarks'
  if (pathname === '/create-post') return 'Create'
  if (pathname === '/leaderboard') return 'Leaderboard'
  if (pathname === '/settings') return 'Settings'
  if (pathname === '/admin') return 'Admin'

  if (pathname.startsWith('/questions/tagged/')) {
    const tag = decodeURIComponent(pathname.split('/questions/tagged/')[1])
    return tag
  }

  if (pathname.startsWith('/leaderboard/')) return 'Leaderboard'
  if (pathname.startsWith('/settings/')) return 'Settings'
  if (pathname.startsWith('/admin/')) return 'Admin'

  if (/^\/questions\/[^/]+\/[^/]+/.test(pathname)) return 'Question'
  if (/^\/lists\/[^/]+/.test(pathname)) return 'List'

  const knownTopLevel = ['/questions', '/leaderboard', '/create-post', '/settings', '/admin', '/lists']
  if (/^\/[^/]+$/.test(pathname) && !knownTopLevel.some((r) => pathname === r)) {
    return 'Profile'
  }

  return 'Previous Page'
}

function createPageEntry(pathname: string): PageEntry {
  return {
    path: pathname,
    name: getPageName(pathname),
    type: getPageType(pathname),
  }
}

export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [previousPage, setPreviousPage] = useState<PageEntry | null>(null)
  const [recentPages, setRecentPages] = useState<Array<PageEntry>>([])
  const currentPathRef = useRef<string>(pathname)

  useEffect(() => {
    if (pathname !== currentPathRef.current) {
      const entry = createPageEntry(currentPathRef.current)
      setPreviousPage(entry)
      setRecentPages((prev) => {
        const filtered = prev.filter((p) => p.path !== currentPathRef.current)
        return [entry, ...filtered].slice(0, MAX_RECENT_PAGES)
      })
      currentPathRef.current = pathname
    }
  }, [pathname])

  return (
    <NavigationHistoryContext.Provider value={{ previousPage, recentPages }}>{children}</NavigationHistoryContext.Provider>
  )
}

export function useNavigationHistory(): NavigationHistoryContextProps {
  return useContext(NavigationHistoryContext)
}
