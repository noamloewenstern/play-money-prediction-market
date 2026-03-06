import db from '@play-money/database'

export async function getUserFollowers({ userId }: { userId: string }) {
  const follows = await db.userFollow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return follows.map((f) => f.follower)
}
