import db from '@play-money/database'

export type PollInput = {
  question: string
  options: Array<string>
  closesAt?: Date | null
}

export async function createCommentPoll({
  commentId,
  question,
  options,
  closesAt,
}: {
  commentId: string
} & PollInput) {
  const poll = await db.commentPoll.create({
    data: {
      commentId,
      question,
      closesAt,
      options: {
        create: options.map((text, index) => ({
          text,
          order: index,
        })),
      },
    },
    include: {
      options: {
        orderBy: { order: 'asc' },
      },
    },
  })

  return poll
}
