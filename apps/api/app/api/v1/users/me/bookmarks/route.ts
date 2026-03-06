import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getUserBookmarks } from '@play-money/markets/lib/getUserBookmarks'
import type schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookmarks = await getUserBookmarks({ userId })

    return NextResponse.json({ data: bookmarks })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to retrieve bookmarks' }, { status: 500 })
  }
}
