import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { bookmarkMarket } from '@play-money/markets/lib/bookmarkMarket'
import { isMarketBookmarked } from '@play-money/markets/lib/isMarketBookmarked'
import { unbookmarkMarket } from '@play-money/markets/lib/unbookmarkMarket'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.get.parameters.parse(params)
    const isBookmarked = await isMarketBookmarked({ userId, marketId: id })

    return NextResponse.json({ data: { isBookmarked } })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to check bookmark status' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.post.parameters.parse(params)
    await bookmarkMarket({ userId, marketId: id })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to bookmark market' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.delete.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.delete.parameters.parse(params)
    await unbookmarkMarket({ userId, marketId: id })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
  }
}
