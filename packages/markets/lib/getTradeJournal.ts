import db from '@play-money/database'

export type TradeJournalEntry = {
  id: string
  userId: string
  marketId: string
  optionId: string
  transactionId: string
  tradeType: string
  note: string | null
  probabilityAtTrade: number | null
  createdAt: Date
  updatedAt: Date
  market: {
    id: string
    question: string
    slug: string
    resolvedAt: Date | null
    canceledAt: Date | null
    marketResolution: {
      resolutionId: string
    } | null
  }
  option: {
    id: string
    name: string
    color: string
  }
}

export async function getTradeJournal({
  userId,
  limit = 20,
  cursor,
}: {
  userId: string
  limit?: number
  cursor?: string
}): Promise<{ entries: Array<TradeJournalEntry>; hasNextPage: boolean; endCursor: string | null; total: number }> {
  const [total, entries] = await Promise.all([
    db.tradeNote.count({ where: { userId } }),
    db.tradeNote.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        market: {
          select: {
            id: true,
            question: true,
            slug: true,
            resolvedAt: true,
            canceledAt: true,
            marketResolution: {
              select: {
                resolutionId: true,
              },
            },
          },
        },
        option: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    }),
  ])

  const hasNextPage = entries.length > limit
  if (hasNextPage) {
    entries.pop()
  }

  const endCursor = entries.length > 0 ? entries[entries.length - 1].id : null

  return { entries, hasNextPage, endCursor, total }
}
