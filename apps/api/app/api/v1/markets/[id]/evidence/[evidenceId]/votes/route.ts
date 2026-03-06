import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { voteOnEvidence } from '@play-money/markets/lib/voteOnEvidence'
import schema from './schema'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 60 })

export async function POST(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const { evidenceId } = schema.post.parameters.parse(params)
    const body = (await req.json()) as unknown
    const { isUpvote } = schema.post.requestBody.parse(body)

    await voteOnEvidence({ evidenceId, userId, isUpvote })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.' }, { status: 500 })
  }
}
