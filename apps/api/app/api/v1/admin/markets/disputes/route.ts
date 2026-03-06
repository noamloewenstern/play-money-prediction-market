import { NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { getResolutionDisputes } from '@play-money/markets/lib/getResolutionDisputes'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getUserById({ id: userId })
    if (!isAdmin({ user: adminUser })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status') as 'PENDING' | 'UNDER_REVIEW' | 'OVERRIDDEN' | 'REJECTED' | null
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)

    const result = await getResolutionDisputes({ status: status ?? undefined, page, limit })

    return NextResponse.json(result)
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
