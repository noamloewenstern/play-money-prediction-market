import db from '@play-money/database'

export type GroupMemberWithUser = {
  id: string
  listId: string
  userId: string
  role: string
  createdAt: Date
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export async function getGroupMembers({ listId }: { listId: string }): Promise<Array<GroupMemberWithUser>> {
  return db.groupMember.findMany({
    where: { listId },
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
    orderBy: { createdAt: 'asc' },
  })
}
