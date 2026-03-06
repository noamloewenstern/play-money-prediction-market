import React from 'react'
import { formatDistanceToNowShort } from '../../ui/src/helpers'

export function SiteActivityItem({
  children,
  icon,
  timestampAt,
  isFirst = false,
  isLast = false,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  timestampAt: Date
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <div className="flex flex-row">
      <div className="relative -ml-1 mr-3 flex w-6 items-center justify-center">
        {!isLast ? (
          <div className="absolute -bottom-4 left-0 top-1/2 flex w-6 justify-center">
            <div className="w-px bg-border/60" />
          </div>
        ) : null}
        {!isFirst ? (
          <div className="absolute -top-4 bottom-1/2 left-0 flex w-6 justify-center">
            <div className="w-px bg-border/60" />
          </div>
        ) : null}

        <div className="relative -m-1 bg-background p-1">{icon}</div>
      </div>
      <div className="flex-1">
        <div className="text-sm leading-relaxed text-muted-foreground">
          {children}{' '}
          <time className="whitespace-nowrap text-xs text-muted-foreground/60" dateTime={timestampAt.toString()}>
            {formatDistanceToNowShort(timestampAt)}
          </time>
        </div>
      </div>
    </div>
  )
}
