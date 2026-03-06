'use client'

import { CheckCheckIcon, ChevronDownIcon, FilterIcon } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { createMyNotifications } from '@play-money/api-helpers/client'
import { Button } from '@play-money/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@play-money/ui/dropdown-menu'
import { ToastAction } from '@play-money/ui/toast'
import { toast } from '@play-money/ui/use-toast'

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  MARKET_TRADE: 'Trade',
  MARKET_RESOLVED: 'Market resolved',
  MARKET_CANCELED: 'Market canceled',
  MARKET_CLOSED: 'Market closed',
  MARKET_LIQUIDITY_ADDED: 'Liquidity added',
  MARKET_COMMENT: 'Market comment',
  LIST_COMMENT: 'List comment',
  COMMENT_REPLY: 'Comment reply',
  COMMENT_REACTION: 'Comment reaction',
  COMMENT_MENTION: 'Mention',
  REFERRER_BONUS: 'Referral bonus',
  TAG_NEW_MARKET: 'New market in tag',
  MARKET_BOOKMARK_RESOLVED: 'Bookmark resolved',
}

const UNDO_WINDOW_MS = 5000

export function NotificationToolbar({
  unreadCount,
  unreadTypes,
  onMarkRead,
}: {
  unreadCount: number
  unreadTypes: Array<string>
  onMarkRead: () => void
}) {
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMarkAllRead = useCallback(async () => {
    try {
      const result = await createMyNotifications()
      const markedAt = result?.data?.markedAt
      onMarkRead()

      if (markedAt) {
        toast({
          title: 'All notifications marked as read',
          action: (
            <ToastAction
              altText="Undo"
              onClick={async () => {
                if (undoTimeoutRef.current) {
                  clearTimeout(undoTimeoutRef.current)
                  undoTimeoutRef.current = null
                }
                try {
                  await createMyNotifications({ undo: true, markedAt })
                  onMarkRead()
                } catch {
                  toast({ title: 'Failed to undo', variant: 'destructive' })
                }
              }}
            >
              Undo
            </ToastAction>
          ),
          duration: UNDO_WINDOW_MS,
        })
      }
    } catch {
      toast({ title: 'Failed to mark notifications as read', variant: 'destructive' })
    }
  }, [onMarkRead])

  const handleMarkTypeRead = useCallback(
    async (type: string) => {
      try {
        const result = await createMyNotifications({ type })
        const markedAt = result?.data?.markedAt
        onMarkRead()

        if (markedAt) {
          const label = NOTIFICATION_TYPE_LABELS[type] ?? type
          toast({
            title: `${label} notifications marked as read`,
            action: (
              <ToastAction
                altText="Undo"
                onClick={async () => {
                  try {
                    await createMyNotifications({ undo: true, markedAt, type })
                    onMarkRead()
                  } catch {
                    toast({ title: 'Failed to undo', variant: 'destructive' })
                  }
                }}
              >
                Undo
              </ToastAction>
            ),
            duration: UNDO_WINDOW_MS,
          })
        }
      } catch {
        toast({ title: 'Failed to mark notifications as read', variant: 'destructive' })
      }
    },
    [onMarkRead]
  )

  if (unreadCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs text-muted-foreground"
        onClick={handleMarkAllRead}
      >
        <CheckCheckIcon className="h-3.5 w-3.5" />
        Mark all read
      </Button>

      {unreadTypes.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
              <FilterIcon className="h-3.5 w-3.5" />
              By type
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {unreadTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => void handleMarkTypeRead(type)}>
                <CheckCheckIcon className="mr-2 h-3.5 w-3.5" />
                Mark all {NOTIFICATION_TYPE_LABELS[type] ?? type} as read
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
