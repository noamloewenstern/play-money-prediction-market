import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { createEvidence } from '@play-money/markets/lib/createEvidence'
import { getEvidenceForMarket } from '@play-money/markets/lib/getEvidenceForMarket'
import schema from './schema'

export const dynamic = 'force-dynamic'

const readLimiter = rateLimit({ windowMs: 60_000, maxRequests: 120 })
const writeLimiter = rateLimit({ windowMs: 60_000, maxRequests: 30 })

export async function GET(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const rateLimitResponse = readLimiter(req)
    if (rateLimitResponse) return rateLimitResponse

    const { id } = schema.get.parameters.parse(params)
    const userId = await getAuthUser(req)

    const evidence = await getEvidenceForMarket({ marketId: id, userId: userId ?? undefined })

    return NextResponse.json({ data: evidence })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: unknown }
): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = writeLimiter(req, userId)
    if (rateLimitResponse) return rateLimitResponse

    const { id } = schema.post.parameters.parse(params)
    const body = (await req.json()) as unknown
    const { title, content, url, evidenceType } = schema.post.requestBody.parse(body)

    const evidence = await createEvidence({
      marketId: id,
      authorId: userId,
      title,
      content,
      url,
      evidenceType,
    })

    const result = {
      ...evidence,
      upvoteCount: 0,
      downvoteCount: 0,
      userVote: null,
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.' }, { status: 500 })
  }
}
