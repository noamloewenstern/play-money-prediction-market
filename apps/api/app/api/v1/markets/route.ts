import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { createList } from '@play-money/lists/lib/createList'
import { createMarket } from '@play-money/markets/lib/createMarket'
import { getMarkets } from '@play-money/markets/lib/getMarkets'
import schema from './schema'

export const dynamic = 'force-dynamic'

const readLimiter = rateLimit({ windowMs: 60_000, maxRequests: 120 })
const writeLimiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function GET(req: Request): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const rateLimitResponse = readLimiter(req)
    if (rateLimitResponse) return rateLimitResponse
    const url = new URL(req.url)
    const searchParams = new URLSearchParams(url.search)
    const params = Object.fromEntries(searchParams)

    const { status = 'active', createdBy, tags, ...paginationParams } = schema.get.parameters.parse(params) ?? {}

    const results = await getMarkets({ createdBy, tags, status }, paginationParams)

    return NextResponse.json(results)
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

export const maxDuration = 60 // Extend max duration for creating lists with lots of markets.

export async function POST(req: Request): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = writeLimiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const body = (await req.json()) as unknown
    const basicMarket = schema.post.requestBody.parse(body)

    switch (basicMarket.type) {
      case 'binary':
      case 'multi': {
        const newMarket = await createMarket({
          ...basicMarket,
          createdBy: userId,
        })
        return NextResponse.json({ data: { market: newMarket } })
      }
      case 'list': {
        const newList = await createList({
          ...basicMarket,
          ownerId: userId,
          title: basicMarket.question,
          markets: basicMarket.options,
          contributionPolicy: basicMarket.contributionPolicy || 'OWNERS_ONLY',
        })
        return NextResponse.json({ data: { list: newList } })
      }
    }
  } catch (error: unknown) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
  }
}
