import crypto from 'crypto'
import { generateMnemonic } from 'bip39'
import { NextResponse } from 'next/server'
import { SchemaResponse } from '@play-money/api-helpers'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { auth } from '@play-money/auth'
import db from '@play-money/database'
import schema from './schema'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 5 })

export async function POST(req: Request): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = limiter(req, session.user.id)
    if (rateLimitResponse) return rateLimitResponse

    const body = (await req.json()) as unknown
    const { name } = schema.post.requestBody.parse(body)

    const plaintextKey = generateMnemonic(128).replace(/\s+/g, '-')
    const hashedKey = crypto.createHash('sha256').update(plaintextKey).digest('hex')
    const keyPrefix = plaintextKey.substring(0, 8)

    const apiKey = await db.apiKey.create({
      data: {
        name,
        hashedKey,
        keyPrefix,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ data: { ...apiKey, key: plaintextKey } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging

    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}

export async function GET(): Promise<SchemaResponse<typeof schema.get.responses>> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await db.apiKey.findMany({
      where: {
        userId: session.user.id,
        isRevoked: false,
      },
    })

    return NextResponse.json({ data: keys })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging

    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
