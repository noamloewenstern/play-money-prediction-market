import { NextResponse } from 'next/server'
import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import db from '@play-money/database'
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
    const body = (await req.json().catch(() => ({}))) as { reason?: string }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        suspendedAt: true,
        bio: true,
        timezone: true,
        twitterHandle: true,
        discordHandle: true,
        website: true,
        referralCode: true,
        primaryAccountId: true,
        createdAt: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await createAuditLog({
      action: 'USER_IMPERSONATE',
      actorId: userId,
      targetType: 'USER',
      targetId: id,
      metadata: { reason: body.reason ?? 'Support investigation' },
    })

    return NextResponse.json({
      data: {
        user: targetUser,
        impersonatedBy: { id: adminUser.id, username: adminUser.username },
        impersonatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
