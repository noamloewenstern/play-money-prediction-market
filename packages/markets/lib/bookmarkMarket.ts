import db from '@play-money/database'

export async function bookmarkMarket({ userId, marketId }: { userId: string; marketId: string }) {
  return db.marketBookmark.create({
    data: {
      userId,
      marketId,
    },
  })
}
