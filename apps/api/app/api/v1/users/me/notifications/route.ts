import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getNotifications } from '@play-money/notifications/lib/getNotifications'
import { getUnreadNotificationCount } from '@play-money/notifications/lib/getUnreadNotificationCount'
import { updateNotificationsRead, undoNotificationsRead } from '@play-money/notifications/lib/updateNotificationsRead'
import type schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [unreadCount, notifications] = await Promise.all([
      getUnreadNotificationCount({ userId }),
      getNotifications({ userId }),
    ])

    return NextResponse.json({ data: { notifications, unreadCount } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging

    return NextResponse.json({ error: 'Failed to retrieve user session' }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { type?: string; groupId?: string; undo?: boolean; markedAt?: string } = {}
    try {
      body = await req.json()
    } catch {
      // No body = mark all as read (backward compatible)
    }

    if (body.undo && body.markedAt) {
      const count = await undoNotificationsRead({
        userId,
        markedAt: body.markedAt,
        type: body.type,
        groupId: body.groupId,
      })
      return NextResponse.json({ data: { success: true, count, markedAt: body.markedAt } })
    }

    const { count, markedAt } = await updateNotificationsRead({
      userId,
      type: body.type,
      groupId: body.groupId,
    })

    return NextResponse.json({ data: { success: true, count, markedAt } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging

    return NextResponse.json({ error: 'Failed to retrieve user session' }, { status: 500 })
  }
}
