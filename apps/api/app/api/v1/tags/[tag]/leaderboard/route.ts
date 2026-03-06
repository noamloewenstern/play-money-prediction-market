import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getTagLeaderboard } from '@play-money/markets/lib/getTagLeaderboard'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const { tag } = schema.get.parameters.parse(params)

    const leaderboard = await getTagLeaderboard({ tag: decodeURIComponent(tag) })

    return NextResponse.json({ data: leaderboard })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
