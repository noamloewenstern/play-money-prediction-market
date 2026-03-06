import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { followUser } from '@play-money/users/lib/followUser'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isFollowingUser } from '@play-money/users/lib/isFollowingUser'
import { unfollowUser } from '@play-money/users/lib/unfollowUser'
import type schema from './schema'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const following = await isFollowingUser({ followerId: userId, followingId: params.id })

    return NextResponse.json({ data: { isFollowing: following } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Failed to check user follow status' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    if (userId === params.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    await followUser({ followerId: userId, followingId: params.id })

    void getUserById({ id: userId }).then((follower) => {
      void createNotification({
        userId: params.id,
        type: 'USER_FOLLOWED',
        actorId: userId,
        actionUrl: `/${follower.username}`,
        groupKey: `user-followed-${userId}`,
      })
    }).catch(() => {
      // Non-critical: notification could not be sent
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<SchemaResponse<typeof schema.delete.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    await unfollowUser({ followerId: userId, followingId: params.id })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
  }
}
