import db from '@play-money/database'

type ExportTransaction = {
  id: string
  type: string
  date: string
  marketQuestion: string | null
  options: string
  amount: string
  isReverse: boolean
}

type ExportPosition = {
  id: string
  marketQuestion: string
  option: string
  quantity: string
  cost: string
  value: string
  date: string
}

type ExportMarket = {
  id: string
  question: string
  slug: string
  tags: string
  closeDate: string | null
  resolvedAt: string | null
  canceledAt: string | null
  uniqueTradersCount: number | null
  commentCount: number | null
  createdAt: string
}

export async function exportUserTransactions({ userId }: { userId: string }): Promise<Array<ExportTransaction>> {
  const transactions = await db.transaction.findMany({
    where: { initiatorId: userId },
    include: {
      entries: true,
      market: true,
      options: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  })

  return transactions.map((tx) => {
    const totalAmount = tx.entries.reduce((sum, entry) => sum + Math.abs(Number(entry.amount)), 0) / 2

    return {
      id: tx.id,
      type: tx.type,
      date: tx.createdAt.toISOString(),
      marketQuestion: tx.market?.question ?? null,
      options: tx.options.map((o) => o.name).join(', '),
      amount: totalAmount.toFixed(2),
      isReverse: tx.isReverse ?? false,
    }
  })
}

export async function exportUserPositions({ userId }: { userId: string }): Promise<Array<ExportPosition>> {
  const positions = await db.marketOptionPosition.findMany({
    where: {
      account: {
        userPrimary: { id: userId },
      },
    },
    include: {
      market: true,
      option: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  })

  return positions.map((pos) => ({
    id: pos.id,
    marketQuestion: pos.market.question,
    option: pos.option.name,
    quantity: Number(pos.quantity).toFixed(4),
    cost: Number(pos.cost).toFixed(2),
    value: Number(pos.value).toFixed(2),
    date: pos.createdAt.toISOString(),
  }))
}

export async function exportUserMarkets({ userId }: { userId: string }): Promise<Array<ExportMarket>> {
  const markets = await db.market.findMany({
    where: { createdBy: userId },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  })

  return markets.map((m) => ({
    id: m.id,
    question: m.question,
    slug: m.slug,
    tags: m.tags.join(', '),
    closeDate: m.closeDate?.toISOString() ?? null,
    resolvedAt: m.resolvedAt?.toISOString() ?? null,
    canceledAt: m.canceledAt?.toISOString() ?? null,
    uniqueTradersCount: m.uniqueTradersCount,
    commentCount: m.commentCount,
    createdAt: m.createdAt.toISOString(),
  }))
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const escapeField = (value: unknown): string => {
    const str = String(value ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeField(row[h])).join(',')),
  ]

  return lines.join('\n')
}
