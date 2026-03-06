import db from '@play-money/database'

export async function getUserFollowing({ userId }: { userId: string }) {
  const follows = await db.userFollow.findMany({
    where: { followerId: userId },
    include: {
      following: {
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
  return follows.map((f) => f.following)
}
