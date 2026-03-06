import db from '@play-money/database'

export async function createTradeNote({
  userId,
  marketId,
  optionId,
  transactionId,
  tradeType,
  note,
  probabilityAtTrade,
}: {
  userId: string
  marketId: string
  optionId: string
  transactionId: string
  tradeType: 'BUY' | 'SELL'
  note?: string
  probabilityAtTrade?: number
}) {
  return db.tradeNote.create({
    data: {
      userId,
      marketId,
      optionId,
      transactionId,
      tradeType,
      note,
      probabilityAtTrade,
    },
  })
}
