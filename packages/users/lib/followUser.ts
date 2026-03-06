import db from '@play-money/database'

export async function followUser({ followerId, followingId }: { followerId: string; followingId: string }) {
  return db.userFollow.create({
    data: {
      followerId,
      followingId,
    },
  })
}
