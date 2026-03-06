import Decimal from 'decimal.js'
import { NextResponse } from 'next/server'
import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import db from '@play-money/database'
import { adminAdjustBalance } from '@play-money/finance/lib/adminAdjustBalance'
import { createHouseUserGiftTransaction } from '@play-money/finance/lib/createHouseUserGiftTransaction'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        emailVerified: true,
        role: true,
        suspendedAt: true,
        bio: true,
        timezone: true,
        twitterHandle: true,
        discordHandle: true,
        website: true,
        referralCode: true,
        referredBy: true,
        primaryAccountId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            markets: true,
            transactions: true,
            comments: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
    const body = (await req.json()) as {
      role?: string
      grantAmount?: number
      balanceAdjustment?: number
      balanceReason?: string
      suspended?: boolean
      suspendReason?: string
    }

    const targetUser = await getUserById({ id })

    if (body.role && (body.role === 'ADMIN' || body.role === 'USER') && body.role !== targetUser.role) {
      const previousRole = targetUser.role
      await db.user.update({
        where: { id },
        data: { role: body.role },
      })
      await createAuditLog({
        action: 'USER_ROLE_CHANGE',
        actorId: userId,
        targetType: 'USER',
        targetId: id,
        before: { role: previousRole },
        after: { role: body.role },
      })
    }

    if (body.grantAmount && body.grantAmount > 0) {
      await createHouseUserGiftTransaction({
        userId: id,
        amount: new Decimal(body.grantAmount),
        initiatorId: userId,
      })
      await createAuditLog({
        action: 'BALANCE_ADJUST',
        actorId: userId,
        targetType: 'USER',
        targetId: id,
        after: { amount: body.grantAmount },
        metadata: { reason: 'Admin grant bonus' },
      })
    }

    if (body.balanceAdjustment && body.balanceAdjustment !== 0) {
      await adminAdjustBalance({
        userId: id,
        amount: body.balanceAdjustment,
        adminId: userId,
        reason: body.balanceReason || 'Admin balance adjustment',
      })
    }

    if (typeof body.suspended === 'boolean') {
      if (body.suspended && !targetUser.suspendedAt) {
        await db.user.update({
          where: { id },
          data: { suspendedAt: new Date() },
        })
        await createAuditLog({
          action: 'USER_SUSPEND',
          actorId: userId,
          targetType: 'USER',
          targetId: id,
          before: { suspendedAt: null },
          after: { suspendedAt: new Date().toISOString() },
          metadata: { reason: body.suspendReason ?? null },
        })
      } else if (!body.suspended && targetUser.suspendedAt) {
        await db.user.update({
          where: { id },
          data: { suspendedAt: null },
        })
        await createAuditLog({
          action: 'USER_UNSUSPEND',
          actorId: userId,
          targetType: 'USER',
          targetId: id,
          before: { suspendedAt: targetUser.suspendedAt.toISOString() },
          after: { suspendedAt: null },
        })
      }
    }

    const updatedUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        avatarUrl: true,
        suspendedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: updatedUser })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
