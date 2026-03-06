import db from '@play-money/database'

export async function isFollowingUser({
  followerId,
  followingId,
}: {
  followerId: string
  followingId: string
}) {
  const follow = await db.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  })
  return Boolean(follow)
}
