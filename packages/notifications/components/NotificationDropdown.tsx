'use client'

import { BellIcon, InboxIcon } from 'lucide-react'
import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { createMyNotifications } from '@play-money/api-helpers/client'
import { useNotifications } from '@play-money/api-helpers/client/hooks'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@play-money/ui/sheet'
import { useUser } from '@play-money/users/context/UserContext'
import { NotificationItem } from './NotificationItem'

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const { data: notificationData, mutate } = useNotifications({ skip: !user })
  const data = notificationData?.data

  const handleMarkAllRead = async () => {
    try {
      await createMyNotifications()
      void mutate()
    } catch (error) {
      console.error('Error marking read:', error)
    }
  }

  return user ? (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <BellIcon className="h-5 w-5" />
          {data?.unreadCount && data?.unreadCount > 0 ? (
            <span className="absolute right-1 top-1 inline-flex h-2 w-2 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"></span>
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
            <Button
              variant="ghost"
              size="sm"
              className="mr-6 text-xs text-muted-foreground"
              disabled={!data?.unreadCount}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {data?.notifications?.length ? (
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
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <InboxIcon className="h-10 w-10 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </SheetContent>
    </Sheet>
  ) : null
}
