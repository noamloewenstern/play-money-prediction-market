import { NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import {
  reviewResolutionDispute,
  DisputeNotFoundError,
  DisputeAlreadyReviewedError,
} from '@play-money/markets/lib/reviewResolutionDispute'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string; disputeId: string } }) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getUserById({ id: userId })
    if (!isAdmin({ user: adminUser })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as {
      action: 'reject' | 'override'
      reviewNote?: string
      newOptionId?: string
      newSupportingLink?: string
    }

    if (!body.action || !['reject', 'override'].includes(body.action)) {
      return NextResponse.json({ error: 'action must be "reject" or "override"' }, { status: 400 })
    }

    if (body.action === 'override' && !body.newOptionId) {
      return NextResponse.json({ error: 'newOptionId is required for override action' }, { status: 400 })
    }

    const result = await reviewResolutionDispute({
      adminId: userId,
      disputeId: params.disputeId,
      action: body.action,
      reviewNote: body.reviewNote,
      newOptionId: body.newOptionId,
      newSupportingLink: body.newSupportingLink,
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    if (error instanceof DisputeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof DisputeAlreadyReviewedError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
