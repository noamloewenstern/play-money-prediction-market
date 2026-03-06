import { NextRequest } from 'next/server'
import { getRateLimitHeaders, RATE_LIMIT_TIERS, rateLimit } from './rateLimit'

function createMockRequest(url = 'http://localhost:3001/api/v1/markets', ip = '127.0.0.1'): NextRequest {
  const req = new NextRequest(url, {
    headers: {
      'x-forwarded-for': ip,
    },
  })
  return req
}

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 5 })
    const req = createMockRequest('http://localhost:3001/api/v1/test-allow', '10.0.0.1')

    for (let i = 0; i < 5; i++) {
      const response = limiter(req)
      expect(response).toBeNull()
    }
  })

  it('blocks requests over the limit with 429 status', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 3 })
    const req = createMockRequest('http://localhost:3001/api/v1/test-block', '10.0.0.2')

    // First 3 should pass
    for (let i = 0; i < 3; i++) {
      expect(limiter(req)).toBeNull()
    }

    // 4th should be blocked
    const response = limiter(req)
    expect(response).not.toBeNull()
    expect(response!.status).toBe(429)

    const body = await response!.json()
    expect(body.error).toBe('Too many requests, please try again later')
  })

  it('returns standard rate limit headers on 429 responses', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 })
    const req = createMockRequest('http://localhost:3001/api/v1/test-headers', '10.0.0.3')

    limiter(req)
    limiter(req)
    const response = limiter(req)

    expect(response).not.toBeNull()
    expect(response!.headers.get('Retry-After')).toBeTruthy()
    expect(response!.headers.get('X-RateLimit-Limit')).toBe('2')
    expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response!.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('uses userId for keying when provided (per-user rate limiting)', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 })
    const req = createMockRequest('http://localhost:3001/api/v1/test-user', '10.0.0.4')

    // User A uses 2 requests
    limiter(req, 'user-a')
    limiter(req, 'user-a')
    const blockedA = limiter(req, 'user-a')
    expect(blockedA).not.toBeNull()
    expect(blockedA!.status).toBe(429)

    // User B should still be allowed (separate key)
    const allowedB = limiter(req, 'user-b')
    expect(allowedB).toBeNull()
  })

  it('uses IP for keying when userId is not provided', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 })

    const req1 = createMockRequest('http://localhost:3001/api/v1/test-ip', '10.0.0.5')
    const req2 = createMockRequest('http://localhost:3001/api/v1/test-ip', '10.0.0.6')

    // IP 1 uses 2 requests
    limiter(req1)
    limiter(req1)
    const blocked = limiter(req1)
    expect(blocked).not.toBeNull()

    // Different IP should still be allowed
    const allowed = limiter(req2)
    expect(allowed).toBeNull()
  })

  it('separates rate limits by pathname', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 })

    const req1 = createMockRequest('http://localhost:3001/api/v1/test-path-a', '10.0.0.7')
    const req2 = createMockRequest('http://localhost:3001/api/v1/test-path-b', '10.0.0.7')

    // Exhaust on path A
    limiter(req1)
    limiter(req1)
    expect(limiter(req1)).not.toBeNull()

    // Path B should still be allowed
    expect(limiter(req2)).toBeNull()
  })
})

describe('getRateLimitHeaders', () => {
  it('returns correct remaining count', () => {
    const config = { windowMs: 60_000, maxRequests: 5 }
    const limiter = rateLimit(config)
    const req = createMockRequest('http://localhost:3001/api/v1/test-remaining', '10.0.0.10')

    // Make 3 requests
    limiter(req)
    limiter(req)
    limiter(req)

    const headers = getRateLimitHeaders(config, req)
    expect(headers['X-RateLimit-Limit']).toBe('5')
    expect(headers['X-RateLimit-Remaining']).toBe('2')
    expect(headers['X-RateLimit-Reset']).toBeTruthy()
  })
})

describe('RATE_LIMIT_TIERS', () => {
  it('defines expected tiers', () => {
    expect(RATE_LIMIT_TIERS.read).toEqual({ windowMs: 60_000, maxRequests: 120 })
    expect(RATE_LIMIT_TIERS.write).toEqual({ windowMs: 60_000, maxRequests: 30 })
    expect(RATE_LIMIT_TIERS.sensitive).toEqual({ windowMs: 60_000, maxRequests: 10 })
    expect(RATE_LIMIT_TIERS.transaction).toEqual({ windowMs: 60_000, maxRequests: 30 })
  })
})
