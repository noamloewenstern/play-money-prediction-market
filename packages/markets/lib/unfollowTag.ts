import db from '@play-money/database'

export async function unfollowTag({ userId, tag }: { userId: string; tag: string }) {
  return db.tagFollow.delete({
    where: {
      userId_tag: {
        userId,
        tag,
      },
    },
  })
}
