import db from '@play-money/database'

export async function isFollowingTag({ userId, tag }: { userId: string; tag: string }) {
  const follow = await db.tagFollow.findUnique({
    where: {
      userId_tag: {
        userId,
        tag,
      },
    },
  })

  return Boolean(follow)
}
