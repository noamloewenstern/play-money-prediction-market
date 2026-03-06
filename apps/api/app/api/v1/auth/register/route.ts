import { NextResponse } from 'next/server'
import { rateLimit } from '@play-money/api-helpers/lib/rateLimit'
import { registerUser, WhitelistError } from '@play-money/auth/lib/registerUser'
import { UserExistsError } from '@play-money/users/lib/exceptions'
import schema from './schema'

export const dynamic = 'force-dynamic'

const limiter = rateLimit({ windowMs: 60_000, maxRequests: 10 })

export async function POST(req: Request) {
  try {
    const rateLimitResponse = limiter(req)
    if (rateLimitResponse) return rateLimitResponse
    const body = (await req.json()) as unknown
    const { email, password, timezone } = schema.post.requestBody.parse(body)

    const result = await registerUser({ email, password, timezone })

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof UserExistsError) {
      return NextResponse.json({ error: 'User with that email already exists' }, { status: 409 })
    }
    if (error instanceof WhitelistError) {
      return NextResponse.json({ error: 'Email not allowed' }, { status: 403 })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
    }

    console.error('Registration error:', error) // eslint-disable-line no-console -- Log error for debugging
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
