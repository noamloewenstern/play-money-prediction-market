import db, { GroupMemberRole } from '@play-money/database'
import { GroupMemberWithUser } from './getGroupMembers'

export async function addGroupMember({
  listId,
  userId,
  role = 'MEMBER',
}: {
  listId: string
  userId: string
  role?: GroupMemberRole
}): Promise<GroupMemberWithUser> {
  return db.groupMember.upsert({
    where: { listId_userId: { listId, userId } },
    create: { listId, userId, role },
    update: { role },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  })
}
