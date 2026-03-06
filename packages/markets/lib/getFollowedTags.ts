import db from '@play-money/database'

export async function getFollowedTags({ userId }: { userId: string }) {
  const follows = await db.tagFollow.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return follows.map((f) => f.tag)
}
