import { NextResponse } from 'next/server'
import { getAuditLogs } from '@play-money/audit-log/lib/getAuditLogs'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserById({ id: userId })
    if (!isAdmin({ user })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const params = {
      action: url.searchParams.get('action') || undefined,
      actorId: url.searchParams.get('actorId') || undefined,
      targetType: url.searchParams.get('targetType') || undefined,
      targetId: url.searchParams.get('targetId') || undefined,
      cursor: url.searchParams.get('cursor') || undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    }

    const { auditLogs, pageInfo } = await getAuditLogs(params as Parameters<typeof getAuditLogs>[0])

    return NextResponse.json({ data: auditLogs, pageInfo })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
