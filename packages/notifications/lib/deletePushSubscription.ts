import db from '@play-money/database'

export async function deletePushSubscription({ userId, endpoint }: { userId: string; endpoint: string }) {
  return db.pushSubscription.deleteMany({
    where: { userId, endpoint },
  })
}
