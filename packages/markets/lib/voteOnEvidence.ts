import db from '@play-money/database'

export async function voteOnEvidence({
  evidenceId,
  userId,
  isUpvote,
}: {
  evidenceId: string
  userId: string
  isUpvote: boolean
}) {
  const existing = await db.marketEvidenceVote.findUnique({
    where: { evidenceId_userId: { evidenceId, userId } },
  })

  if (existing) {
    if (existing.isUpvote === isUpvote) {
      // Toggle off — remove the vote
      await db.marketEvidenceVote.delete({ where: { id: existing.id } })
      return null
    }
    // Change vote direction
    return db.marketEvidenceVote.update({
      where: { id: existing.id },
      data: { isUpvote },
    })
  }

  return db.marketEvidenceVote.create({
    data: { evidenceId, userId, isUpvote },
  })
}
