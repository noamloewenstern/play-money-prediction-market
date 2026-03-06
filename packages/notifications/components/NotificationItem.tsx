import {
  AlertTriangleIcon,
  AtSignIcon,
  BellRingIcon,
  BookmarkIcon,
  CheckCircle2Icon,
  DropletsIcon,
  GiftIcon,
  HashIcon,
  LockIcon,
  MessageSquareIcon,
  ScaleIcon,
  SmileIcon,
  TrendingUpIcon,
  UnlockIcon,
  UserPlusIcon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { formatNumber } from '@play-money/finance/lib/formatCurrency'
import { calculateBalanceChanges, findBalanceChange } from '@play-money/finance/lib/helpers'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { cn } from '@play-money/ui/utils'
import { formatDistanceToNowShort } from '../../ui/src/helpers'
import { NotificationGroupWithLastNotification } from '../lib/getNotifications'

const NOTIFICATION_ICON_MAP: Record<string, { icon: React.ElementType; className: string }> = {
  MARKET_RESOLVED: { icon: CheckCircle2Icon, className: 'text-success' },
  MARKET_CANCELED: { icon: XCircleIcon, className: 'text-destructive' },
  MARKET_CLOSED: { icon: LockIcon, className: 'text-warning' },
  MARKET_TRADE: { icon: TrendingUpIcon, className: 'text-info' },
  MARKET_LIQUIDITY_ADDED: { icon: DropletsIcon, className: 'text-info' },
  MARKET_COMMENT: { icon: MessageSquareIcon, className: 'text-muted-foreground' },
  LIST_COMMENT: { icon: MessageSquareIcon, className: 'text-muted-foreground' },
  COMMENT_REPLY: { icon: MessageSquareIcon, className: 'text-muted-foreground' },
  COMMENT_REACTION: { icon: SmileIcon, className: 'text-warning' },
  COMMENT_MENTION: { icon: AtSignIcon, className: 'text-primary-foreground' },
  REFERRER_BONUS: { icon: GiftIcon, className: 'text-success' },
  TAG_NEW_MARKET: { icon: HashIcon, className: 'text-info' },
  MARKET_BOOKMARK_RESOLVED: { icon: BookmarkIcon, className: 'text-success' },
  MARKET_EVIDENCE_ADDED: { icon: ScaleIcon, className: 'text-info' },
  MARKET_PROBABILITY_ALERT: { icon: BellRingIcon, className: 'text-warning' },
  RESOLUTION_DISPUTE_FLAGGED: { icon: AlertTriangleIcon, className: 'text-warning' },
  RESOLUTION_DISPUTE_REVIEWED: { icon: CheckCircle2Icon, className: 'text-info' },
  USER_FOLLOWED: { icon: UserPlusIcon, className: 'text-primary' },
  CONDITIONAL_MARKET_ACTIVATED: { icon: UnlockIcon, className: 'text-success' },
}

function createSnippet(htmlString: string, maxLength = 150) {
  const textContent = htmlString.replace(/<[^>]*>/g, '')
  const decodedText = decodeHTMLEntities(textContent)
  const trimmedText = decodedText.trim()

  if (trimmedText.length > maxLength) {
    return trimmedText.substring(0, maxLength).trim() + '...'
  }

  return trimmedText
}

function decodeHTMLEntities(text: string) {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  }
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, function (match) {
    return entities[match]
  })
}

export function NotificationItem({
  notification,
  count,
  unread = true,
}: {
  notification: NotificationGroupWithLastNotification['lastNotification']
  count: number
  unread: boolean
}) {
  let topLine = ''
  let bottomLine = ''

  const othersCount = count > 1 ? ` & ${count} other${count != 1 ? 's' : ''} ` : ''

  switch (notification.type) {
    case 'MARKET_RESOLVED': {
      topLine = notification.market.question
      bottomLine = `Resolved ${notification.marketOption.name} by ${notification.actor.displayName}`
      break
    }
    case 'MARKET_CANCELED': {
      topLine = notification.market.question
      bottomLine = `Canceled by ${notification.actor.displayName}`
      break
    }
    case 'MARKET_CLOSED': {
      topLine = notification.market.question
      bottomLine = 'Trading has closed. This market is awaiting resolution.'
      break
    }
    case 'MARKET_TRADE': {
      // Transactions Rewrite blew away old transactions.
      if (!notification.transaction) {
        topLine = notification.market.question
        bottomLine = 'Old bet'
        break
      }
      const balanceChanges = calculateBalanceChanges(notification.transaction)
      const primaryChange = findBalanceChange({
        balanceChanges,
        accountId: notification.actor.primaryAccountId,
        assetType: 'CURRENCY',
        assetId: 'PRIMARY',
      })

      topLine = notification.market.question
      bottomLine = `${notification.actor.displayName} bet: ¤${formatNumber(Math.abs(primaryChange?.change ?? 0))} ${notification.marketOption.name}${othersCount}`
      break
    }
    case 'MARKET_LIQUIDITY_ADDED': {
      // Transactions Rewrite blew away old transactions.
      if (!notification.transaction) {
        topLine = notification.market.question
        bottomLine = 'Old bet'
        break
      }
      const balanceChanges = calculateBalanceChanges(notification.transaction)
      const primaryChange = findBalanceChange({
        balanceChanges,
        accountId: notification.actor.primaryAccountId,
        assetType: 'CURRENCY',
        assetId: 'PRIMARY',
      })

      topLine = notification.market.question
      bottomLine = `¤${formatNumber(Math.abs(primaryChange?.change ?? 0))} liquidity added by ${notification.actor.displayName}${othersCount}`
      break
    }
    case 'MARKET_COMMENT': {
      topLine = notification.market.question
      bottomLine = !notification.comment
        ? `${notification.actor.displayName} commented and deleted comment`
        : `${notification.actor.displayName} commented: ${createSnippet(notification.comment.content)}`
      break
    }
    case 'LIST_COMMENT': {
      topLine = notification.list.title
      bottomLine = !notification.comment
        ? `${notification.actor.displayName} commented and deleted comment`
        : `${notification.actor.displayName} commented: ${createSnippet(notification.comment.content)}`
      break
    }
    case 'COMMENT_REPLY': {
      topLine = notification.parentComment?.content
        ? createSnippet(notification.parentComment.content)
        : notification.market
          ? notification.market.question
          : notification.list
            ? notification.list.title
            : ''
      bottomLine = !notification.comment
        ? `${notification.actor.displayName} commented and deleted comment`
        : `${notification.actor.displayName}${othersCount} replied: ${createSnippet(notification.comment.content)}`
      break
    }
    case 'COMMENT_REACTION': {
      topLine = !notification.comment ? `Deleted comment` : createSnippet(notification.comment.content)
      bottomLine = `${notification.actor.displayName}${othersCount} reacted: ${notification.commentReaction?.emoji}`
      break
    }
    case 'COMMENT_MENTION': {
      topLine = notification.parentComment?.content
        ? createSnippet(notification.parentComment.content)
        : notification.market
          ? notification.market.question
          : notification.list
            ? notification.list.title
            : ''
      bottomLine = !notification.comment
        ? `${notification.actor.displayName} mentioned you in a deleted comment`
        : `${notification.actor.displayName}${othersCount} mentioned you: ${createSnippet(notification.comment.content)}`
      break
    }
    case 'REFERRER_BONUS': {
      const balanceChanges = calculateBalanceChanges(notification.transaction)
      const amount = Math.abs(balanceChanges[0].change)

      topLine = 'You recieved a referral bonus'
      bottomLine = `¤${formatNumber(amount)} from ${notification.actor.displayName}${othersCount}`
      break
    }
    case 'TAG_NEW_MARKET': {
      topLine = 'New market in followed tag'
      bottomLine = `${notification.actor?.displayName} created: ${notification.market?.question}`
      break
    }
    case 'MARKET_BOOKMARK_RESOLVED': {
      topLine = 'Bookmarked market resolved'
      bottomLine = `${notification.market?.question} resolved ${notification.marketOption?.name}`
      break
    }
    case 'MARKET_EVIDENCE_ADDED': {
      topLine = 'New evidence submitted'
      bottomLine = `${notification.actor?.displayName} added evidence to: ${notification.market?.question}`
      break
    }
    case 'MARKET_PROBABILITY_ALERT': {
      topLine = 'Probability alert triggered'
      bottomLine = `${notification.marketOption?.name} crossed your alert threshold on: ${notification.market?.question}`
      break
    }
    case 'RESOLUTION_DISPUTE_FLAGGED': {
      topLine = 'Resolution dispute filed'
      bottomLine = `${notification.actor?.displayName} flagged the resolution of: ${notification.market?.question}`
      break
    }
    case 'RESOLUTION_DISPUTE_REVIEWED': {
      topLine = 'Resolution dispute reviewed'
      bottomLine = `Your dispute for "${notification.market?.question}" has been reviewed`
      break
    }
    case 'USER_FOLLOWED': {
      topLine = 'New follower'
      bottomLine = `${notification.actor?.displayName} started following you`
      break
    }
    case 'CONDITIONAL_MARKET_ACTIVATED': {
      topLine = 'Conditional market activated'
      bottomLine = `Your market "${notification.market?.question}" is now open for trading`
      break
    }
    // default: {
    //   topLine = notification.type
    //   bottomLine = ''
    // }
  }

  const iconInfo = NOTIFICATION_ICON_MAP[notification.type]
  const TypeIcon = iconInfo?.icon

  return (
    <Link href={notification.actionUrl}>
      <div className={cn('flex min-w-0 gap-2 px-4 py-3 transition-colors hover:bg-muted/50', unread && 'bg-muted/30')}>
        <div className="relative mt-1 flex-shrink-0">
          {notification.actor ? (
            <UserAvatar user={notification.actor} />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted-foreground"></div>
          )}
          {TypeIcon ? (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-soft-xs">
              <TypeIcon className={cn('h-3 w-3', iconInfo.className)} />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className={cn('mb-0.5 flex gap-2 text-sm', unread ? 'text-foreground' : 'text-muted-foreground')}>
            {unread ? <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div> : null}
            <div className="truncate">{topLine}</div>
          </div>
          <div className="flex items-end gap-2 text-xs text-muted-foreground">
            <div className="line-clamp-3 min-w-0 flex-1">{bottomLine}</div>
            <div className="flex-shrink-0">{formatDistanceToNowShort(notification.createdAt)}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
