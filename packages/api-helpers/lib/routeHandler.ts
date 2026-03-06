import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { type RateLimitTier, RATE_LIMIT_TIERS, getRateLimitHeaders, rateLimit } from './rateLimit'

type RouteContext = { params: Record<string, string> }

type HandlerContext = RouteContext & { userId?: string }

type AuthHandlerContext = RouteContext & { userId: string }

type RouteHandlerFn = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>

type RateLimitOption = RateLimitTier | { windowMs: number; maxRequests: number }

export function createRouteHandler(options: {
  auth: true
  rateLimit?: RateLimitOption
  handler: (req: NextRequest, ctx: AuthHandlerContext) => Promise<NextResponse>
}): RouteHandlerFn
export function createRouteHandler(options: {
  auth?: false
  rateLimit?: RateLimitOption
  handler: (req: NextRequest, ctx: HandlerContext) => Promise<NextResponse>
}): RouteHandlerFn
export function createRouteHandler(options: {
  auth?: boolean
  rateLimit?: RateLimitOption
  handler: (req: NextRequest, ctx: HandlerContext) => Promise<NextResponse>
}): RouteHandlerFn {
  const rateLimitConfig = options.rateLimit
    ? typeof options.rateLimit === 'string'
      ? RATE_LIMIT_TIERS[options.rateLimit]
      : options.rateLimit
    : undefined
  const limiter = rateLimitConfig ? rateLimit(rateLimitConfig) : undefined

  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      // Resolve auth first so we can use userId for per-user rate limiting
      let userId: string | undefined
      if (options.auth) {
        userId = await getAuthUser(req)
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      // Apply rate limiting (per-user if authenticated, per-IP otherwise)
      if (limiter) {
        const rateLimitResponse = limiter(req, userId)
        if (rateLimitResponse) return rateLimitResponse
      }

      const response = await options.handler(req, { ...ctx, userId })

      // Attach rate limit headers to successful responses
      if (rateLimitConfig && limiter) {
        const headers = getRateLimitHeaders(rateLimitConfig, req, userId)
        for (const [headerName, headerValue] of Object.entries(headers)) {
          response.headers.set(headerName, headerValue)
        }
      }

      return response
    } catch (error: unknown) {
      console.log(error) // eslint-disable-line no-console -- Log error for debugging

      if (error instanceof Error) {
        const statusCode = error.name.includes('NotFound') ? 404 : 400
        return NextResponse.json({ error: error.message }, { status: statusCode })
      }

      return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
    }
  }
}
