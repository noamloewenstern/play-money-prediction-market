import { getUserFollowers } from './getUserFollowers'

export async function notifyUserFollowers({
  followingId,
  notify,
}: {
  followingId: string
  notify: (followerId: string) => Promise<void>
}) {
  const followers = await getUserFollowers({ userId: followingId })
  await Promise.all(followers.map((follower) => notify(follower.id)))
}
