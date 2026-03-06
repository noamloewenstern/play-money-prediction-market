import db from '@play-money/database'

export class EvidenceNotFoundError extends Error {
  static code = 'EVIDENCE_NOT_FOUND'
  constructor(message = 'Evidence not found') {
    super(message)
    this.name = 'EvidenceNotFoundError'
  }
}

export class EvidenceUnauthorizedError extends Error {
  static code = 'EVIDENCE_UNAUTHORIZED'
  constructor(message = 'Not authorized to delete this evidence') {
    super(message)
    this.name = 'EvidenceUnauthorizedError'
  }
}

export async function deleteEvidence({
  evidenceId,
  userId,
  isAdmin,
}: {
  evidenceId: string
  userId: string
  isAdmin?: boolean
}) {
  const evidence = await db.marketEvidence.findUnique({ where: { id: evidenceId } })

  if (!evidence) {
    throw new EvidenceNotFoundError()
  }

  if (!isAdmin && evidence.authorId !== userId) {
    throw new EvidenceUnauthorizedError()
  }

  await db.marketEvidence.delete({ where: { id: evidenceId } })
}
