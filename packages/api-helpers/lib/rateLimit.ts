import { NextRequest, NextResponse } from 'next/server'

type RateLimitConfig = {
  windowMs: number
  maxRequests: number
}

/**
 * Predefined rate limit tiers for different endpoint types.
 * Usage: `rateLimit(RATE_LIMIT_TIERS.write)`
 */
export const RATE_LIMIT_TIERS = {
  /** Read-heavy endpoints: 120 requests per minute */
  read: { windowMs: 60_000, maxRequests: 120 },
  /** Write endpoints: 30 requests per minute */
  write: { windowMs: 60_000, maxRequests: 30 },
  /** Sensitive endpoints (auth, API keys): 10 requests per minute */
  sensitive: { windowMs: 60_000, maxRequests: 10 },
  /** Financial transaction endpoints: 30 requests per minute */
  transaction: { windowMs: 60_000, maxRequests: 30 },
} as const satisfies Record<string, RateLimitConfig>

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS

type SlidingWindowEntry = {
  /** Request timestamps within the current window */
  timestamps: Array<number>
}

const store = new Map<string, SlidingWindowEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1]! + 120_000 < now) {
      store.delete(key)
    }
  }
}, 60_000)

function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  return headers.get('x-real-ip') ?? 'unknown'
}

function getPathname(req: NextRequest | Request): string {
  if (req instanceof NextRequest) {
    return req.nextUrl.pathname
  }
  return new URL(req.url).pathname
}

/**
 * Creates a sliding window rate limiter.
 *
 * Supports both per-IP (default) and per-user keying.
 * When `userId` is provided, rate limiting is applied per-user instead of per-IP,
 * giving authenticated users consistent limits regardless of IP changes.
 *
 * Returns `null` if the request is allowed, or a 429 NextResponse if rate limited.
 * Adds standard rate limit headers to successful responses via `applyRateLimitHeaders`.
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest | Request, userId?: string): NextResponse | null => {
    const pathname = getPathname(req)
    const identifier = userId ?? getClientIp(req)
    const key = `${identifier}:${pathname}`
    const now = Date.now()
    const windowStart = now - config.windowMs

    let entry = store.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      store.set(key, entry)
    }

    // Remove timestamps outside the sliding window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

    if (entry.timestamps.length >= config.maxRequests) {
      const oldestInWindow = entry.timestamps[0]!
      const retryAfterMs = oldestInWindow + config.windowMs - now
      const retryAfterSec = Math.ceil(retryAfterMs / 1_000)
      const resetTime = Math.ceil((oldestInWindow + config.windowMs) / 1_000)

      return NextResponse.json(
        { error: 'Too many requests, please try again later' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetTime),
          },
        }
      )
    }

    // Record this request
    entry.timestamps.push(now)

    return null
  }
}

/**
 * Returns rate limit headers for a successful response.
 * Call after `rateLimit()` returns null to attach headers to the response.
 */
export function getRateLimitHeaders(
  config: RateLimitConfig,
  req: NextRequest | Request,
  userId?: string
): Record<string, string> {
  const pathname = getPathname(req)
  const identifier = userId ?? getClientIp(req)
  const key = `${identifier}:${pathname}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  const entry = store.get(key)
  if (!entry) {
    return {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(config.maxRequests),
      'X-RateLimit-Reset': String(Math.ceil((now + config.windowMs) / 1_000)),
    }
  }

  const activeTimestamps = entry.timestamps.filter((t) => t > windowStart)
  const remaining = Math.max(0, config.maxRequests - activeTimestamps.length)
  const oldestInWindow = activeTimestamps[0] ?? now
  const resetTime = Math.ceil((oldestInWindow + config.windowMs) / 1_000)

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetTime),
  }
}
