import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { CommentNotFoundError } from '@play-money/comments/lib/exceptions'
import { getComment } from '@play-money/comments/lib/getComment'
import { pinComment, TooManyPinnedCommentsError, CannotPinReplyError } from '@play-money/comments/lib/pinComment'
import { unpinComment } from '@play-money/comments/lib/unpinComment'
import db from '@play-money/database'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'
import schema from './schema'

export const dynamic = 'force-dynamic'

async function canPinComment({ userId, entityType, entityId }: { userId: string; entityType: string; entityId: string }) {
  const user = await getUserById({ id: userId })
  if (isAdmin({ user })) return true

  if (entityType === 'MARKET') {
    const market = await db.market.findUnique({ where: { id: entityId }, select: { createdBy: true } })
    return market?.createdBy === userId
  }

  if (entityType === 'LIST') {
    const list = await db.list.findUnique({ where: { id: entityId }, select: { ownerId: true } })
    return list?.ownerId === userId
  }

  return false
}

export async function POST(
  _req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(_req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.post.parameters.parse(params)
    const comment = await getComment({ id })

    if (comment.parentId) {
      return NextResponse.json({ error: 'Cannot pin a reply comment' }, { status: 400 })
    }

    const hasPermission = await canPinComment({ userId, entityType: comment.entityType, entityId: comment.entityId })
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await pinComment({ id, entityType: comment.entityType, entityId: comment.entityId })

    return NextResponse.json({ data: updated })
  } catch (error) {
    if (error instanceof CommentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof TooManyPinnedCommentsError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof CannotPinReplyError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.delete.responses>> {
  try {
    const userId = await getAuthUser(_req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.delete.parameters.parse(params)
    const comment = await getComment({ id })

    const hasPermission = await canPinComment({ userId, entityType: comment.entityType, entityId: comment.entityId })
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await unpinComment({ id })

    return NextResponse.json({ data: updated })
  } catch (error) {
    if (error instanceof CommentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
