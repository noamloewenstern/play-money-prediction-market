import { NextResponse } from 'next/server'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getMarket } from '@play-money/markets/lib/getMarket'
import { resolveNumericMarket } from '@play-money/markets/lib/resolveNumericMarket'
import { canModifyMarket } from '@play-money/markets/rules'
import { getUserById } from '@play-money/users/lib/getUserById'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 10 })

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const { id } = params
    const body = (await req.json()) as { numericValue: unknown; supportingLink?: string }

    if (body.numericValue == null || typeof body.numericValue !== 'number') {
      return NextResponse.json({ error: 'numericValue (number) is required' }, { status: 400 })
    }

    const market = await getMarket({ id, extended: true })
    const resolvingUser = await getUserById({ id: userId })

    if (!canModifyMarket({ market, user: resolvingUser })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (market.numericMin == null || market.numericMax == null) {
      return NextResponse.json({ error: 'Market is not a numeric range market' }, { status: 400 })
    }

    await resolveNumericMarket({
      resolverId: userId,
      marketId: id,
      numericValue: body.numericValue,
      supportingLink: body.supportingLink,
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
