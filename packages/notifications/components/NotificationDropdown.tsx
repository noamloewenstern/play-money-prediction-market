'use client'

import { BellIcon, InboxIcon, TrendingUpIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useNotifications, useUnreadNotificationCount } from '@play-money/api-helpers/client/hooks'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@play-money/ui/sheet'
import { useUser } from '@play-money/users/context/UserContext'
import { NotificationItem } from './NotificationItem'
import { NotificationListSkeleton } from './NotificationListSkeleton'
import { NotificationToolbar } from './NotificationToolbar'

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const { data: notificationData, mutate } = useNotifications({ skip: !user })
  const { data: unreadData, mutate: mutateUnread } = useUnreadNotificationCount({ skip: !user })
  const data = notificationData?.data
  const unreadCount = unreadData?.data?.count ?? 0

  const unreadTypes = useMemo(() => {
    if (!data?.notifications) return []
    const types = new Set<string>()
    for (const group of data.notifications) {
      if (!group.lastNotification.readAt) {
        types.add(group.lastNotification.type)
      }
    }
    return Array.from(types)
  }, [data?.notifications])

  const refreshNotifications = useCallback(() => {
    void mutate()
    void mutateUnread()
  }, [mutate, mutateUnread])

  return user ? (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md" side="right">
        <ErrorBoundary
          fallback={
            <div className="p-4 text-sm uppercase text-muted-foreground">
              There was an error loading notifications
            </div>
          }
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
              {data?.unreadCount ? (
                <Badge variant="secondary" className="tabular-nums">
                  {data.unreadCount}
                </Badge>
              ) : null}
            </div>
            <div className="mr-6">
              <NotificationToolbar
                unreadCount={data?.unreadCount ?? 0}
                unreadTypes={unreadTypes}
                onMarkRead={refreshNotifications}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!data ? (
              <NotificationListSkeleton />
            ) : data.notifications?.length ? (
              <div className="divide-y">
                {data.notifications.map(({ id, count, lastNotification }) => (
                  <div key={id} onClick={() => setIsOpen(false)}>
                    <NotificationItem
                      notification={lastNotification}
                      count={count}
                      unread={!lastNotification.readAt}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                  <InboxIcon className="size-6 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">No notifications yet</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    When someone trades on your markets, replies to your comments, or mentions you, you&apos;ll see it
                    here.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1"
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/'
                  }}
                >
                  <TrendingUpIcon className="mr-1.5 size-3.5" />
                  Explore Markets
                </Button>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </SheetContent>
    </Sheet>
  ) : null
}
