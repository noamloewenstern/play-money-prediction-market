import db from '@play-money/database'

export async function followTag({ userId, tag }: { userId: string; tag: string }) {
  return db.tagFollow.create({
    data: {
      userId,
      tag,
    },
  })
}
