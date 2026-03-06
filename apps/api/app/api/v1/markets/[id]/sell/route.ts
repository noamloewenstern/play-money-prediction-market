import Decimal from 'decimal.js'
import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import {
  InsufficientBalanceError,
  InsufficientSharesError,
  MarketClosedError,
  MarketResolvedError,
  MarketCanceledError,
} from '@play-money/markets/lib/exceptions'
import { marketSell } from '@play-money/markets/lib/marketSell'
import schema from './schema'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function POST(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const { id } = schema.post.parameters.parse(params)

    const body = (await req.json()) as unknown
    const { optionId, amount, note } = schema.post.requestBody.parse(body)

    await marketSell({
      marketId: id,
      optionId,
      userId,
      amount: new Decimal(amount),
      note,
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof MarketClosedError) {
      return NextResponse.json(
        { error: error.message, code: MarketClosedError.code },
        { status: 400 }
      )
    }
    if (error instanceof MarketResolvedError) {
      return NextResponse.json(
        { error: error.message, code: MarketResolvedError.code },
        { status: 400 }
      )
    }
    if (error instanceof MarketCanceledError) {
      return NextResponse.json(
        { error: error.message, code: MarketCanceledError.code },
        { status: 400 }
      )
    }
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: error.message, code: InsufficientBalanceError.code },
        { status: 400 }
      )
    }
    if (error instanceof InsufficientSharesError) {
      return NextResponse.json(
        { error: error.message, code: InsufficientSharesError.code },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.', code: 'UNKNOWN_ERROR' }, { status: 500 })
  }
}
