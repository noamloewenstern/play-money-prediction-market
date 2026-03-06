import db from '@play-money/database'

export class PollClosedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PollClosedError'
  }
}

export class PollOptionNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PollOptionNotFoundError'
  }
}

export async function voteOnCommentPoll({
  pollId,
  optionId,
  userId,
}: {
  pollId: string
  optionId: string
  userId: string
}) {
  const poll = await db.commentPoll.findUnique({
    where: { id: pollId },
    include: { options: true },
  })

  if (!poll) {
    throw new PollOptionNotFoundError(`Poll with id "${pollId}" not found`)
  }

  if (poll.closesAt && poll.closesAt < new Date()) {
    throw new PollClosedError('This poll is closed')
  }

  const option = poll.options.find((o) => o.id === optionId)
  if (!option) {
    throw new PollOptionNotFoundError(`Option with id "${optionId}" not found in poll "${pollId}"`)
  }

  const existingVote = await db.commentPollVote.findUnique({
    where: { userId_pollId: { userId, pollId } },
  })

  if (existingVote && existingVote.optionId === optionId) {
    // Toggle off - remove vote
    await db.commentPollVote.delete({ where: { id: existingVote.id } })
    return null
  } else if (existingVote) {
    // Change vote to new option
    return db.commentPollVote.update({
      where: { id: existingVote.id },
      data: { optionId },
    })
  } else {
    // New vote
    return db.commentPollVote.create({
      data: { pollId, optionId, userId },
    })
  }
}
