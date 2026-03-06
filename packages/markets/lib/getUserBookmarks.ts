import db from '@play-money/database'

export async function getUserBookmarks({ userId }: { userId: string }) {
  const bookmarks = await db.marketBookmark.findMany({
    where: { userId },
    include: {
      market: {
        include: {
          user: true,
          options: true,
          marketResolution: {
            include: {
              resolution: true,
              resolvedBy: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return bookmarks
}
