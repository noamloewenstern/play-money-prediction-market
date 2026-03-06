import db from '@play-money/database'

export async function removeGroupMember({ listId, userId }: { listId: string; userId: string }): Promise<void> {
  await db.groupMember.delete({
    where: { listId_userId: { listId, userId } },
  })
}
