import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<SchemaResponse<typeof schema.post.responses>> {
  try {
    const body = (await req.json()) as unknown
    const { skills, cliVersion } = schema.post.requestBody.parse(body)

    console.log('[claude-skills] Install tracked:', { skills, cliVersion }) // eslint-disable-line no-console -- Analytics logging

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
