import db from '@play-money/database'
import { CommentNotFoundError } from './exceptions'

export type CommentEditHistoryEntry = {
  id: string
  content: string
  editedAt: Date
  editedBy: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export async function getCommentEditHistory({ commentId }: { commentId: string }): Promise<Array<CommentEditHistoryEntry>> {
  const comment = await db.comment.findUnique({ where: { id: commentId } })

  if (!comment) {
    throw new CommentNotFoundError()
  }

  const edits = await db.commentEdit.findMany({
    where: { commentId },
    orderBy: { editedAt: 'desc' },
    select: {
      id: true,
      content: true,
      editedAt: true,
      editedBy: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  })

  return edits
}
