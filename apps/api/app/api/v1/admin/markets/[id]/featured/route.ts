import { NextResponse } from 'next/server'
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

    const market = await db.market.findUnique({ where: { id }, select: { id: true, isFeatured: true } })
    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    const newFeaturedState = !market.isFeatured
    const updatedMarket = await db.market.update({
      where: { id },
      data: {
        isFeatured: newFeaturedState,
        featuredAt: newFeaturedState ? new Date() : null,
      },
      select: { id: true, isFeatured: true, featuredAt: true },
    })

    return NextResponse.json({ data: updatedMarket })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
