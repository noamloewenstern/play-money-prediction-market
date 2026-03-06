import { NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { createPushSubscription } from '@play-money/notifications/lib/createPushSubscription'
import { deletePushSubscription } from '@play-money/notifications/lib/deletePushSubscription'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    data: {
      publicKey: process.env.VAPID_PUBLIC_KEY || null,
    },
  })
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      endpoint: string
      keys: { p256dh: string; auth: string }
      userAgent?: string
    }

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    const subscription = await createPushSubscription({
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent,
    })

    return NextResponse.json({ data: subscription })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    return NextResponse.json({ error: 'Failed to create push subscription' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { endpoint: string }

    if (!body.endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    await deletePushSubscription({ userId, endpoint: body.endpoint })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    return NextResponse.json({ error: 'Failed to delete push subscription' }, { status: 500 })
  }
}
