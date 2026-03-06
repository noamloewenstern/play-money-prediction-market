import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import db from '@play-money/database'
import { getList } from '@play-money/lists/lib/getList'
import { addGroupMember } from '@play-money/lists/lib/addGroupMember'
import { getGroupMembers } from '@play-money/lists/lib/getGroupMembers'
import { canManageMembers } from '@play-money/lists/rules'
import { getUserById } from '@play-money/users/lib/getUserById'
import { getUserByUsername } from '@play-money/users/lib/getUserByUsername'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const { id } = schema.get.parameters.parse(params)

    const members = await getGroupMembers({ listId: id })

    return NextResponse.json({ data: members })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.post.parameters.parse(params)
    const body = (await req.json()) as unknown
    const { userId: targetUserId, username, role } = schema.post.requestBody.parse(body)

    if (!targetUserId && !username) {
      return NextResponse.json({ error: 'Either userId or username is required' }, { status: 400 })
    }

    const list = await getList({ id })
    const user = await getUserById({ id: userId })

    // Fetch the requesting user's group member role
    const requesterMember = await db.groupMember.findUnique({
      where: { listId_userId: { listId: id, userId } },
      select: { role: true },
    })

    if (!canManageMembers({ list, user, memberRole: requesterMember?.role })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Resolve userId from username if needed
    let resolvedUserId = targetUserId
    if (!resolvedUserId && username) {
      const targetUser = await getUserByUsername({ username })
      resolvedUserId = targetUser.id
    }

    // Only owners (list.ownerId or OWNER role member) can assign OWNER or MODERATOR roles
    const isOwner = list.ownerId === user.id || requesterMember?.role === 'OWNER'
    if (role && (role === 'OWNER' || role === 'MODERATOR') && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: only owners can assign owner or moderator roles' }, { status: 403 })
    }

    const member = await addGroupMember({ listId: id, userId: resolvedUserId!, role })

    return NextResponse.json({ data: member })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
