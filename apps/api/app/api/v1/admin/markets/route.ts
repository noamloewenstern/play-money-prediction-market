import { NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import db from '@play-money/database'
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
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || 'all'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.question = { contains: search, mode: 'insensitive' }
    }

    if (status === 'active') {
      where.resolvedAt = null
      where.canceledAt = null
    } else if (status === 'resolved') {
      where.resolvedAt = { not: null }
    } else if (status === 'canceled') {
      where.canceledAt = { not: null }
    }

    const [markets, total] = await Promise.all([
      db.market.findMany({
        where,
        select: {
          id: true,
          question: true,
          slug: true,
          closeDate: true,
          resolvedAt: true,
          canceledAt: true,
          createdBy: true,
          commentCount: true,
          uniqueTradersCount: true,
          liquidityCount: true,
          createdAt: true,
          updatedAt: true,
          options: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.market.count({ where }),
    ])

    return NextResponse.json({
      data: markets,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
