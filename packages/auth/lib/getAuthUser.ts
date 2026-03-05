import crypto from 'crypto'
import { auth } from '@play-money/auth'
import db from '@play-money/database'

export async function getAuthUser(request: Request): Promise<string | null> {
  const session = await auth()
  if (session?.user?.id) {
    return session.user.id
  }

  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return null
  }

  const keyPrefix = apiKey.substring(0, 8)
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')

  const candidates = await db.apiKey.findMany({
    where: {
      keyPrefix,
      isRevoked: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      userId: true,
      hashedKey: true,
    },
  })

  const apiKeyRecord = candidates.find((candidate) => candidate.hashedKey === hashedKey)

  if (!apiKeyRecord) {
    return null
  }

  // Update last used timestamp
  await db.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() },
  })

  return apiKeyRecord.userId
}
