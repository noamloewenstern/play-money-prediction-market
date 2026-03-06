import { NextResponse } from 'next/server'
import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getMarket } from '@play-money/markets/lib/getMarket'
import { resolveMarket } from '@play-money/markets/lib/resolveMarket'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getUserById({ id: userId })
    if (!isAdmin({ user: adminUser })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const body = (await req.json()) as { optionId: string; supportingLink?: string; reason?: string }

    if (!body.optionId) {
      return NextResponse.json({ error: 'optionId is required' }, { status: 400 })
    }

    const market = await getMarket({ id, extended: true })

    await resolveMarket({
      resolverId: userId,
      marketId: id,
      optionId: body.optionId,
      supportingLink: body.supportingLink,
    })

    await createAuditLog({
      action: 'MARKET_RESOLVE',
      actorId: userId,
      targetType: 'MARKET',
      targetId: id,
      after: { optionId: body.optionId, supportingLink: body.supportingLink ?? null },
      metadata: { reason: body.reason ?? 'Admin force-resolve', question: market.question },
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
