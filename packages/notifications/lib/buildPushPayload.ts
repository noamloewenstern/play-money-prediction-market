import db from '@play-money/database'
import { NotificationTypeType } from '@play-money/database/zod/inputTypeSchemas/NotificationTypeSchema'

const PUSH_NOTIFICATION_TYPES: Array<NotificationTypeType> = [
  'MARKET_RESOLVED',
  'MARKET_CANCELED',
  'COMMENT_REPLY',
  'COMMENT_MENTION',
  'MARKET_PROBABILITY_ALERT',
]

export function shouldSendPush(type: NotificationTypeType): boolean {
  return PUSH_NOTIFICATION_TYPES.includes(type)
}

export async function buildPushPayload(
  type: NotificationTypeType,
  opts: { marketId?: string; actionUrl: string },
): Promise<{ title: string; body: string; url: string } | null> {
  const { marketId, actionUrl } = opts

  let marketQuestion: string | undefined

  if (marketId) {
    const market = await db.market.findUnique({ where: { id: marketId }, select: { question: true } })
    marketQuestion = market?.question
  }

  switch (type) {
    case 'MARKET_RESOLVED':
      return {
        title: 'Market Resolved',
        body: marketQuestion ? `"${marketQuestion}" has been resolved` : 'A market you participated in has been resolved',
        url: actionUrl,
      }

    case 'MARKET_CANCELED':
      return {
        title: 'Market Cancelled',
        body: marketQuestion ? `"${marketQuestion}" has been cancelled` : 'A market you participated in has been cancelled',
        url: actionUrl,
      }

    case 'COMMENT_REPLY':
      return {
        title: 'New Reply',
        body: 'Someone replied to your comment',
        url: actionUrl,
      }

    case 'COMMENT_MENTION':
      return {
        title: 'You were mentioned',
        body: 'Someone mentioned you in a comment',
        url: actionUrl,
      }

    case 'MARKET_PROBABILITY_ALERT':
      return {
        title: 'Probability Alert',
        body: marketQuestion ? `Probability alert triggered for "${marketQuestion}"` : 'A probability alert was triggered',
        url: actionUrl,
      }

    default:
      return null
  }
}
