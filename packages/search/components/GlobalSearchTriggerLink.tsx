'use client'

import Link from 'next/link'
import React from 'react'
import { Button } from '@play-money/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@play-money/ui/popover'
import { cn } from '@play-money/ui/utils'
import { useUser } from '@play-money/users/context/UserContext'
import { GlobalSearchMenu } from './GlobalSearchMenu'

export function GlobalSearchTriggerLink({ className }: { className?: string }) {
  const { user } = useUser()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!user) return

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    const openSearch = () => setOpen(true)
    document.addEventListener('keydown', down)
    window.addEventListener('keyboard:search', openSearch)
    return () => {
      document.removeEventListener('keydown', down)
      window.removeEventListener('keyboard:search', openSearch)
    }
  }, [user])

  if (!user) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button className={cn('p-0 opacity-50', className)} variant="link">
            Search
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 text-center">
          <p className="mb-2 text-sm font-semibold">Sign in to search</p>
          <Link href="/login">
            <Button size="sm">Sign in</Button>
          </Link>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <Button className={cn('p-0', className)} variant="link" onClick={() => setOpen(true)}>
        Search
      </Button>

      <GlobalSearchMenu open={open} onOpenChange={setOpen} />
    </>
  )
}
