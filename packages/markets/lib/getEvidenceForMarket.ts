import db from '@play-money/database'
import { MarketEvidence, MarketEvidenceVote, User } from '@play-money/database'

export type EvidenceWithVotesAndAuthor = MarketEvidence & {
  author: User
  votes: Array<MarketEvidenceVote>
  upvoteCount: number
  downvoteCount: number
  userVote?: boolean | null
}

export async function getEvidenceForMarket({
  marketId,
  userId,
}: {
  marketId: string
  userId?: string
}): Promise<Array<EvidenceWithVotesAndAuthor>> {
  const evidence = await db.marketEvidence.findMany({
    where: { marketId },
    include: {
      author: true,
      votes: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return evidence.map((item) => {
    const upvoteCount = item.votes.filter((v) => v.isUpvote).length
    const downvoteCount = item.votes.filter((v) => !v.isUpvote).length
    const userVote = userId ? item.votes.find((v) => v.userId === userId)?.isUpvote ?? null : undefined

    return {
      ...item,
      upvoteCount,
      downvoteCount,
      userVote,
    }
  })
}
