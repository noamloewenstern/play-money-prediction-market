import db from '@play-money/database'

export class TradeNoteNotFoundError extends Error {
  static code = 'TRADE_NOTE_NOT_FOUND'
  constructor() {
    super('Trade note not found or you do not have permission to edit it.')
  }
}

export async function updateTradeNote({
  id,
  userId,
  note,
}: {
  id: string
  userId: string
  note: string
}) {
  const existing = await db.tradeNote.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new TradeNoteNotFoundError()
  }

  return db.tradeNote.update({
    where: { id },
    data: { note },
  })
}
