import db from '@play-money/database'

const MAX_PINNED_COMMENTS = 3

export class TooManyPinnedCommentsError extends Error {
  static code = 'TOO_MANY_PINNED_COMMENTS'

  constructor(message = `Cannot pin more than ${MAX_PINNED_COMMENTS} comments`) {
    super(message)
    this.name = 'TooManyPinnedCommentsError'
  }
}

export class CannotPinReplyError extends Error {
  static code = 'CANNOT_PIN_REPLY'

  constructor(message = 'Cannot pin a reply comment') {
    super(message)
    this.name = 'CannotPinReplyError'
  }
}

export async function pinComment({ id, entityType, entityId }: { id: string; entityType: string; entityId: string }) {
  const pinnedCount = await db.comment.count({
    where: {
      entityType: entityType as 'MARKET' | 'LIST',
      entityId,
      pinnedAt: { not: null },
      id: { not: id },
    },
  })

  if (pinnedCount >= MAX_PINNED_COMMENTS) {
    throw new TooManyPinnedCommentsError()
  }

  return db.comment.update({
    where: { id },
    data: { pinnedAt: new Date() },
  })
}
