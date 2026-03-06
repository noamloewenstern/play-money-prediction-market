/**
 * Next.js Edge Middleware — request correlation & trace propagation.
 *
 * Responsibilities:
 *  1. Generate a unique `x-request-id` for every inbound request so that
 *     server logs, traces, and client responses share a common identifier.
 *  2. Forward any `traceparent` / `tracestate` headers from the browser
 *     (e.g. from a future browser OTEL SDK) to downstream services.
 *  3. Create a fresh `traceparent` header for requests that don't carry one,
 *     so that all server-side spans are grouped under a single trace even
 *     when the browser doesn't send OTEL context.
 *  4. Expose the `x-request-id` on the response so the client can correlate
 *     its own logs with server traces.
 *
 * NOTE: This middleware runs in the Edge runtime and therefore cannot use
 * the Node.js OTEL SDK.  Span creation here is done manually using the W3C
 * Trace Context format.  The API server will continue the same trace because
 * the `traceparent` header is forwarded through every fetch() call made by
 * the web server.
 */

import { NextRequest, NextResponse } from 'next/server'

/** Generate a cryptographically-random lowercase hex string of `bytes` bytes. */
function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Build a W3C traceparent header value.
 * Format: 00-<traceId(32 hex)>-<spanId(16 hex)>-01
 */
function buildTraceparent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`
}

export function middleware(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? randomHex(16)

  // Determine trace context
  let traceparent = req.headers.get('traceparent')
  let tracestate = req.headers.get('tracestate') ?? ''

  if (!traceparent) {
    // No upstream trace — start a fresh root trace for this browser request
    const traceId = randomHex(16)
    const spanId = randomHex(8)
    traceparent = buildTraceparent(traceId, spanId)
  }

  // Clone the request with enriched headers for downstream use
  const reqHeaders = new Headers(req.headers)
  reqHeaders.set('x-request-id', requestId)
  reqHeaders.set('traceparent', traceparent)
  if (tracestate) reqHeaders.set('tracestate', tracestate)

  const response = NextResponse.next({ request: { headers: reqHeaders } })

  // Expose trace correlation headers on the response
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-traceparent', traceparent)

  return response
}

export const config = {
  // Apply to all routes except static assets, Next.js internals, and PWA files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|icons/).*)'],
}
