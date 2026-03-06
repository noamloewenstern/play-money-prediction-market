import db, { GroupMemberRole } from '@play-money/database'
import { GroupMemberWithUser } from './getGroupMembers'

export async function updateGroupMember({
  listId,
  userId,
  role,
}: {
  listId: string
  userId: string
  role: GroupMemberRole
}): Promise<GroupMemberWithUser> {
  return db.groupMember.update({
    where: { listId_userId: { listId, userId } },
    data: { role },
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
