import db from '@play-money/database'

export async function unfollowUser({ followerId, followingId }: { followerId: string; followingId: string }) {
  return db.userFollow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  })
}
