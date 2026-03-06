import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { followTag } from '@play-money/markets/lib/followTag'
import { isFollowingTag } from '@play-money/markets/lib/isFollowingTag'
import { unfollowTag } from '@play-money/markets/lib/unfollowTag'
import type schema from './schema'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function GET(
  req: Request,
  { params }: { params: { tag: string } }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const following = await isFollowingTag({ userId, tag: params.tag })

    return NextResponse.json({ data: { isFollowing: following } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Failed to check tag follow status' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { tag: string } }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    await followTag({ userId, tag: params.tag })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Failed to follow tag' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { tag: string } }
): Promise<SchemaResponse<typeof schema.delete.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    await unfollowTag({ userId, tag: params.tag })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Failed to unfollow tag' }, { status: 500 })
  }
}
