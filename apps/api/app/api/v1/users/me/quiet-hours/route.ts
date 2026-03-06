import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getQuietHoursSettings } from '@play-money/notifications/lib/getQuietHoursSettings'
import { updateQuietHoursSettings } from '@play-money/notifications/lib/updateQuietHoursSettings'
import type schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getQuietHoursSettings({ userId })

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging

    return NextResponse.json({ error: 'Failed to retrieve quiet hours settings' }, { status: 500 })
  }
}

export async function PATCH(req: Request): Promise<SchemaResponse<typeof schema.patch.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as Record<string, unknown>

    const settings = await updateQuietHoursSettings({
      userId,
      quietHoursEnabled: body.quietHoursEnabled as boolean | undefined,
      quietHoursStart: body.quietHoursStart as number | null | undefined,
      quietHoursEnd: body.quietHoursEnd as number | null | undefined,
      doNotDisturb: body.doNotDisturb as boolean | undefined,
    })

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging

    return NextResponse.json({ error: 'Failed to update quiet hours settings' }, { status: 500 })
  }
}
