import Decimal from 'decimal.js'
import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { addLiquidity } from '@play-money/markets/lib/addLiquidity'
import { InsufficientBalanceError, MarketCanceledError, MarketResolvedError } from '@play-money/markets/lib/exceptions'
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
    const { amount } = schema.post.requestBody.parse(body)

    await addLiquidity({
      userId,
      amount: new Decimal(amount),
      marketId: id,
    })

    return NextResponse.json({
      data: {
        success: true,
      },
    })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (
      error instanceof InsufficientBalanceError ||
      error instanceof MarketResolvedError ||
      error instanceof MarketCanceledError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
