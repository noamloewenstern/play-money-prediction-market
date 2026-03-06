import db from '@play-money/database'

export async function isMarketBookmarked({ userId, marketId }: { userId: string; marketId: string }) {
  const bookmark = await db.marketBookmark.findUnique({
    where: {
      userId_marketId: {
        userId,
        marketId,
      },
    },
  })

  return Boolean(bookmark)
}
