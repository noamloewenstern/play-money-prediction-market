import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { TradeNoteNotFoundError, updateTradeNote } from '@play-money/markets/lib/updateTradeNote'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.patch.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.patch.parameters.parse(params)
    const body = (await req.json()) as unknown
    const { note } = schema.patch.requestBody.parse(body)

    await updateTradeNote({ id, userId, note })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof TradeNoteNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update trade note' }, { status: 500 })
  }
}
