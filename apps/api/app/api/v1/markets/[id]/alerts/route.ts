import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import db from '@play-money/database'
import { createProbabilityAlert } from '@play-money/markets/lib/createProbabilityAlert'
import { getMarketAlerts } from '@play-money/markets/lib/getMarketAlerts'
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

    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = schema.get.parameters.parse(params)

    const alerts = await getMarketAlerts({ marketId: id, userId })

    return NextResponse.json({ data: alerts })
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
    const { optionId, threshold, direction } = schema.post.requestBody.parse(body)

    const alert = await createProbabilityAlert({
      userId,
      marketId: id,
      optionId,
      threshold,
      direction,
    })

    const alertWithOption = await db.probabilityAlert.findUnique({
      where: { id: alert.id },
      include: { option: true },
    })

    return NextResponse.json({ data: alertWithOption })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.' }, { status: 500 })
  }
}
