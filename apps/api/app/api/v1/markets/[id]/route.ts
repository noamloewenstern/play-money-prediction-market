import { NextResponse } from 'next/server'
import { stripUndefined, type SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { MarketNotFoundError } from '@play-money/markets/lib/exceptions'
import { getMarket } from '@play-money/markets/lib/getMarket'
import { updateMarket } from '@play-money/markets/lib/updateMarket'
import { canModifyMarket, canViewMarket } from '@play-money/markets/rules'
import { getUserById } from '@play-money/users/lib/getUserById'
import schema from './schema'

export const dynamic = 'force-dynamic'

// TODO: Look into a better way to handle mixing vercel params and search params together...
export async function GET(
  req: Request,
  { params: idParams }: { params: Record<string, unknown> }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const url = new URL(req.url)
    const searchParams = new URLSearchParams(url.search)
    const params = Object.fromEntries(searchParams)

    const { id, extended } = schema.get.parameters.parse({ ...params, ...idParams })

    const market = await getMarket({ id, extended })

    // Check visibility access for private markets
    if (market.visibility === 'PRIVATE') {
      const userId = await getAuthUser(req).catch(() => null)
      if (!userId) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 })
      }
      const user = await getUserById({ id: userId })
      if (!canViewMarket({ market, user })) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ data: market })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

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
    const { question, description, resolutionCriteria, closeDate, tags, createdBy, visibility } = schema.patch.requestBody
      .transform(stripUndefined)
      .parse(body)

    const market = await getMarket({ id })
    const user = await getUserById({ id: userId })

    if (!canModifyMarket({ market, user })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updatedMarket = await updateMarket({ id, question, description, resolutionCriteria, closeDate, tags, createdBy, visibility })

    return NextResponse.json({ data: updatedMarket })
  } catch (error) {
    if (error instanceof MarketNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
