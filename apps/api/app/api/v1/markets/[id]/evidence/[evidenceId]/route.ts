import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { deleteEvidence, EvidenceNotFoundError, EvidenceUnauthorizedError } from '@play-money/markets/lib/deleteEvidence'
import { getUserById } from '@play-money/users/lib/getUserById'
import schema from './schema'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function DELETE(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.delete.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const { evidenceId } = schema.delete.parameters.parse(params)

    const user = await getUserById({ id: userId })
    const isAdmin = user?.role === 'ADMIN'

    await deleteEvidence({ evidenceId, userId, isAdmin })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    if (error instanceof EvidenceNotFoundError) {
      return NextResponse.json({ error: error.message, code: EvidenceNotFoundError.code }, { status: 404 })
    }
    if (error instanceof EvidenceUnauthorizedError) {
      return NextResponse.json({ error: error.message, code: EvidenceUnauthorizedError.code }, { status: 403 })
    }
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.' }, { status: 500 })
  }
}
