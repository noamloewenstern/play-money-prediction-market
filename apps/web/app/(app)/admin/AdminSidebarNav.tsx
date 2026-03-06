'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { buttonVariants } from '@play-money/ui/button'
import { cn } from '@play-money/ui/utils'

type AdminSidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: Array<{
    href: string
    title: string
  }>
}

export function AdminSidebarNav({ className, items, ...props }: AdminSidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex space-x-2 lg:w-[250px] lg:flex-col lg:space-x-0 lg:space-y-1', className)} {...props}>
      {items.map((item) => (
        <Link
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href ? 'bg-muted hover:bg-muted' : 'hover:bg-transparent hover:underline',
            'justify-start'
          )}
          href={item.href}
          key={item.href}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
