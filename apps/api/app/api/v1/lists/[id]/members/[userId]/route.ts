import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import db from '@play-money/database'
import { getList } from '@play-money/lists/lib/getList'
import { removeGroupMember } from '@play-money/lists/lib/removeGroupMember'
import { updateGroupMember } from '@play-money/lists/lib/updateGroupMember'
import { canManageMembers } from '@play-money/lists/rules'
import { getUserById } from '@play-money/users/lib/getUserById'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.patch.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, userId: targetUserId } = schema.patch.parameters.parse(params)
    const body = (await req.json()) as unknown
    const { role } = schema.patch.requestBody.parse(body)

    const list = await getList({ id })
    const user = await getUserById({ id: userId })

    const requesterMember = await db.groupMember.findUnique({
      where: { listId_userId: { listId: id, userId } },
      select: { role: true },
    })

    // Only list owner or OWNER role member can update roles
    const isOwner = list.ownerId === user.id || requesterMember?.role === 'OWNER'
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: only owners can change member roles' }, { status: 403 })
    }

    // Cannot demote the last OWNER or change ownerId holder's role to non-owner
    if (targetUserId === list.ownerId && role !== 'OWNER') {
      return NextResponse.json({ error: 'Cannot change role of the list creator' }, { status: 403 })
    }

    const updated = await updateGroupMember({ listId: id, userId: targetUserId, role })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.delete.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, userId: targetUserId } = schema.delete.parameters.parse(params)

    const list = await getList({ id })
    const user = await getUserById({ id: userId })

    const requesterMember = await db.groupMember.findUnique({
      where: { listId_userId: { listId: id, userId } },
      select: { role: true },
    })

    // Owner/moderator can remove any member; members can remove themselves
    if (!canManageMembers({ list, user, memberRole: requesterMember?.role }) && userId !== targetUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await removeGroupMember({ listId: id, userId: targetUserId })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
