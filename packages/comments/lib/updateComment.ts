import db, { Comment } from '@play-money/database'

export async function updateComment({ id, content, editedById }: { id: string; content?: string; editedById?: string }) {
  const updatedData: Partial<Comment> = {}

  if (content) {
    // Save current content to edit history before updating
    const currentComment = await db.comment.findUnique({ where: { id }, select: { content: true, authorId: true } })

    if (currentComment) {
      await db.commentEdit.create({
        data: {
          commentId: id,
          content: currentComment.content,
          editedById: editedById ?? currentComment.authorId,
        },
      })
    }

    updatedData.content = content
    updatedData.edited = true
  }

  const updatedComment = await db.comment.update({
    where: { id },
    data: { ...updatedData, updatedAt: new Date() },
  })

  return updatedComment
}
