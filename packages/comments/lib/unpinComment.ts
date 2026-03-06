import db from '@play-money/database'

export async function unpinComment({ id }: { id: string }) {
  return db.comment.update({
    where: { id },
    data: { pinnedAt: null },
  })
}
