import { NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import {
  flagResolutionDispute,
  DisputeWindowClosedError,
  MarketNotResolvedError,
  DisputeAlreadyExistsError,
} from '@play-money/markets/lib/flagResolutionDispute'
import { getMarketResolutionDisputes } from '@play-money/markets/lib/getResolutionDisputes'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const disputes = await getMarketResolutionDisputes({ marketId: params.id })
    return NextResponse.json({ data: disputes })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { reason: string }

    if (!body.reason || body.reason.trim().length === 0) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 })
    }

    const dispute = await flagResolutionDispute({
      userId,
      marketId: params.id,
      reason: body.reason.trim(),
    })

    return NextResponse.json({ data: dispute }, { status: 201 })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    if (error instanceof DisputeWindowClosedError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof MarketNotResolvedError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof DisputeAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
