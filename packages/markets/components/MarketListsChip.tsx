'use client'

import { ListIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { List } from '@play-money/database'
import { Badge } from '@play-money/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@play-money/ui/popover'

export function MarketListsChip({ lists }: { lists: Array<{ list: List }> }) {
  if (!lists.length) {
    return null
  }

  if (lists.length === 1) {
    const { list } = lists[0]
    return (
      <Link href={`/lists/${list.id}/${list.slug}`}>
        <Badge variant="secondary" className="cursor-pointer gap-1 font-normal">
          <ListIcon className="size-3" />
          {list.title}
        </Badge>
      </Link>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button">
          <Badge variant="secondary" className="cursor-pointer gap-1 font-normal">
            <ListIcon className="size-3" />
            Part of {lists.length} lists
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="space-y-1">
          {lists.map(({ list }) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}/${list.slug}`}
              className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {list.title}
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
