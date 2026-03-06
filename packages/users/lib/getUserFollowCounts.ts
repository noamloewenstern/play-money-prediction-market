import db from '@play-money/database'

export async function getUserFollowCounts({ userId }: { userId: string }) {
  const [followersCount, followingCount] = await Promise.all([
    db.userFollow.count({ where: { followingId: userId } }),
    db.userFollow.count({ where: { followerId: userId } }),
  ])
  return { followersCount, followingCount }
}
