import { NextResponse } from 'next/server'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { deleteProbabilityAlert } from '@play-money/markets/lib/deleteProbabilityAlert'

export const dynamic = 'force-dynamic'

const writeLimiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function DELETE(req: Request, { params }: { params: unknown }) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = writeLimiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const { alertId } = params as { alertId: string }

    await deleteProbabilityAlert({ alertId, userId })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.' }, { status: 500 })
  }
}
