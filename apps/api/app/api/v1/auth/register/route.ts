import { NextResponse } from 'next/server'
import { registerUser, WhitelistError } from '@play-money/auth/lib/registerUser'
import { UserExistsError } from '@play-money/users/lib/exceptions'
import schema from './schema'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown
    const { email, password } = schema.post.requestBody.parse(body)

    const result = await registerUser({ email, password })

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
