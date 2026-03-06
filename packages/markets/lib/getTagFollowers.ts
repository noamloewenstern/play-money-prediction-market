import db from '@play-money/database'

export async function getTagFollowers({ tags }: { tags: string[] }) {
  if (!tags.length) return []

  const follows = await db.tagFollow.findMany({
    where: {
      tag: { in: tags },
    },
    select: {
      userId: true,
    },
    distinct: ['userId'],
  })

  return follows.map((f) => f.userId)
}
