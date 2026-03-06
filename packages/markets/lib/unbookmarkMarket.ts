import db from '@play-money/database'

export async function unbookmarkMarket({ userId, marketId }: { userId: string; marketId: string }) {
  return db.marketBookmark.delete({
    where: {
      userId_marketId: {
        userId,
        marketId,
      },
    },
  })
}
