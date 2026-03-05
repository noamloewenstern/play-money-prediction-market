import {
  CommentReaction,
  Market,
  MarketOption,
  Transaction,
  TransactionEntry,
  User,
  Comment,
  List,
} from '@play-money/database'
import { NotificationTypeType } from '@play-money/database/zod/inputTypeSchemas/NotificationTypeSchema'

type CreateNotificationBase = {
  type: NotificationTypeType
  actorId?: string
  marketId?: string
  marketOptionId?: string
  commentId?: string
  parentCommentId?: string
  commentReactionId?: string
  transactionId?: string
}

type NotificationContentBase = {
  type: NotificationTypeType
}

export type CreateMarketResolvedNotification = CreateNotificationBase & {
  type: 'MARKET_RESOLVED'
  actorId: string
  marketId: string
  marketOptionId: string
}

export type MarketResolvedNotificationContent = NotificationContentBase & {
  type: 'MARKET_RESOLVED'
  actor: User
  market: Market
  marketOption: MarketOption
}

export type CreateMarketCanceledNotification = CreateNotificationBase & {
  type: 'MARKET_CANCELED'
  actorId: string
  marketId: string
}

export type MarketCanceledNotificationContent = NotificationContentBase & {
  type: 'MARKET_CANCELED'
  actor: User
  market: Market
}

export type CreateMarketClosedNotification = CreateNotificationBase & {
  type: 'MARKET_CLOSED'
  actorId: string
  marketId: string
}

export type MarketClosedNotificationContent = NotificationContentBase & {
  type: 'MARKET_CLOSED'
  actor: User
  market: Market
}

export type MarketTradeNotificationContent = NotificationContentBase & {
  type: 'MARKET_TRADE'
  actor: User
  market: Market
  marketOption: MarketOption
  transaction: Transaction & {
    entries: Array<TransactionEntry>
  }
}

export type CreateMarketTradeNotification = CreateNotificationBase & {
  type: 'MARKET_TRADE'
  actorId: string
  marketId: string
  marketOptionId: string
  transactionId: string
}

export type MarketLiquidityAddedNotificationContent = NotificationContentBase & {
  type: 'MARKET_LIQUIDITY_ADDED'
  actor: User
  market: Market
  transaction: Transaction & {
    entries: Array<TransactionEntry>
  }
}

export type CreateMarketLiquidityAddedNotification = CreateNotificationBase & {
  type: 'MARKET_LIQUIDITY_ADDED'
  actorId: string
  marketId: string
  transactionId: string
}

export type MarketCommentNotificationContent = NotificationContentBase & {
  type: 'MARKET_COMMENT'
  actor: User
  market: Market
  comment: Comment
}

export type CreateMarketCommentNotification = CreateNotificationBase & {
  type: 'MARKET_COMMENT'
  actorId: string
  marketId: string
  commentId: string
}

export type ListCommentNotificationContent = NotificationContentBase & {
  type: 'LIST_COMMENT'
  actor: User
  list: List
  market?: Market
  comment: Comment
}

export type CreateListCommentNotification = CreateNotificationBase & {
  type: 'LIST_COMMENT'
  actorId: string
  listId: string
  marketId?: string
  commentId: string
}

export type CommentReplyNotificationContent = NotificationContentBase & {
  type: 'COMMENT_REPLY'
  actor: User
  market?: Market
  list?: List
  comment: Comment
  parentComment: Comment
}

export type CreateCommentReplyNotification = CreateNotificationBase & {
  type: 'COMMENT_REPLY'
  actorId: string
  marketId?: string
  listId?: string
  commentId: string
  parentCommentId: string
}

export type CommentReactionNotificationContent = NotificationContentBase & {
  type: 'COMMENT_REACTION'
  actor: User
  market?: Market
  list?: List
  comment: Comment
  commentReaction: CommentReaction
}

export type CreateCommentReactionNotification = CreateNotificationBase & {
  type: 'COMMENT_REACTION'
  actorId: string
  marketId?: string
  listId?: string
  commentId: string
  commentReactionId: string
}

export type CommentMentionNotificationContent = NotificationContentBase & {
  type: 'COMMENT_MENTION'
  actor: User
  market?: Market
  list?: List
  comment: Comment
  parentComment?: Comment
}

export type CreateCommentMentionNotification = CreateNotificationBase & {
  type: 'COMMENT_MENTION'
  actorId: string
  marketId?: string
  listId?: string
  commentId: string
  parentCommentId?: string
}

export type ReferrerBonusNotificationContent = NotificationContentBase & {
  type: 'REFERRER_BONUS'
  actor: User
  market?: Market
  transaction: Transaction & {
    entries: Array<TransactionEntry>
  }
}

export type CreateReferrerBonusNotification = CreateNotificationBase & {
  type: 'REFERRER_BONUS'
  actorId: string
  marketId?: string
  transactionId?: string
}

export type TagNewMarketNotificationContent = NotificationContentBase & {
  type: 'TAG_NEW_MARKET'
  actor: User
  market: Market
}

export type CreateTagNewMarketNotification = CreateNotificationBase & {
  type: 'TAG_NEW_MARKET'
  actorId: string
  marketId: string
}

export type NotificationContent =
  | MarketResolvedNotificationContent
  | MarketCanceledNotificationContent
  | MarketClosedNotificationContent
  | MarketTradeNotificationContent
  | MarketLiquidityAddedNotificationContent
  | MarketCommentNotificationContent
  | ListCommentNotificationContent
  | CommentReplyNotificationContent
  | CommentMentionNotificationContent
  | CommentReactionNotificationContent
  | ReferrerBonusNotificationContent
  | TagNewMarketNotificationContent

export type CreateNotificationData =
  | CreateMarketResolvedNotification
  | CreateMarketCanceledNotification
  | CreateMarketClosedNotification
  | CreateMarketTradeNotification
  | CreateMarketLiquidityAddedNotification
  | CreateMarketCommentNotification
  | CreateListCommentNotification
  | CreateCommentReplyNotification
  | CreateCommentReactionNotification
  | CreateCommentMentionNotification
  | CreateReferrerBonusNotification
  | CreateTagNewMarketNotification
