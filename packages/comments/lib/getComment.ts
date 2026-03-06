import type { CommentPoll, CommentPollOption, CommentPollVote } from '@prisma/client'
import db, { Comment, CommentReaction, User } from '@play-money/database'
import { CommentNotFoundError } from './exceptions'

export type CommentPollOptionWithVotes = CommentPollOption & {
  votes: Array<CommentPollVote>
}

export type CommentPollWithOptions = CommentPoll & {
  options: Array<CommentPollOptionWithVotes>
}

export type CommentWithReactions = Comment & {
  author: User
  reactions: Array<
    CommentReaction & {
      user: User
    }
  >
  poll: CommentPollWithOptions | null
}

export const commentInclude = {
  author: true,
  reactions: {
    include: {
      user: true,
    },
  },
  poll: {
    include: {
      options: {
        orderBy: { order: 'asc' as const },
        include: {
          votes: true,
        },
      },
    },
  },
} as const

export async function getComment({ id }: { id: string }): Promise<CommentWithReactions> {
  const comment = await db.comment.findUnique({
    where: {
      id,
    },
    include: commentInclude,
  })

  if (!comment) {
    throw new CommentNotFoundError(`Comment with id "${id}" not found`)
  }

  return comment
}
