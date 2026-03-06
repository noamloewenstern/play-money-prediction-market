import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getTradeJournal } from '@play-money/markets/lib/getTradeJournal'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const { limit, cursor } = schema.get.parameters.parse(Object.fromEntries(url.searchParams))

    const { entries, hasNextPage, endCursor, total } = await getTradeJournal({
      userId,
      limit: limit ?? 20,
      cursor,
    })

    return NextResponse.json({ data: entries, pageInfo: { hasNextPage, endCursor, total } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Failed to retrieve trade journal' }, { status: 500 })
  }
}
