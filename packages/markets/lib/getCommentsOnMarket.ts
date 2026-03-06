import { CommentWithReactions, commentInclude } from '@play-money/comments/lib/getComment'
import db from '@play-money/database'

export async function getCommentsOnMarket({ marketId }: { marketId: string }): Promise<Array<CommentWithReactions>> {
  const comments = await db.comment.findMany({
    where: {
      entityType: 'MARKET',
      entityId: marketId,
    },
    include: commentInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return comments
}
