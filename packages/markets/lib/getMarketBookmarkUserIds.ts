import db from '@play-money/database'

export async function getMarketBookmarkUserIds({ marketId }: { marketId: string }) {
  const bookmarks = await db.marketBookmark.findMany({
    where: { marketId },
    select: { userId: true },
  })

  return bookmarks.map((b) => b.userId)
}
