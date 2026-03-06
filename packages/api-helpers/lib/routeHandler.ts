import { NextRequest, NextResponse } from 'next/server'
import { SpanKind, SpanStatusCode, context, propagation, trace } from '@opentelemetry/api'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { type RateLimitTier, RATE_LIMIT_TIERS, getRateLimitHeaders, rateLimit } from './rateLimit'

type RouteContext = { params: Record<string, string> }

type HandlerContext = RouteContext & { userId?: string }

type AuthHandlerContext = RouteContext & { userId: string }

type RouteHandlerFn = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>

type RateLimitOption = RateLimitTier | { windowMs: number; maxRequests: number }

const tracer = trace.getTracer('@play-money/api-helpers', '1.0.0')

/**
 * Extracts the route template from the request URL path.
 * Converts dynamic segments like UUIDs to `{id}` placeholders to keep spans
 * low-cardinality for Jaeger aggregation.
 */
function routeTemplate(url: URL, params: Record<string, string>): string {
  let pathname = url.pathname
  for (const value of Object.values(params)) {
    pathname = pathname.replace(value, `{${value.length > 10 ? 'id' : value}}`)
  }
  return pathname
}

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
    const url = new URL(req.url)
    const method = req.method.toUpperCase()
    const path = routeTemplate(url, ctx.params ?? {})
    const spanName = `${method} ${path}`

    // Extract remote trace context so this span is a child of the caller's trace
    const remoteCtx = propagation.extract(context.active(), Object.fromEntries(req.headers))

    return context.with(remoteCtx, () =>
      tracer.startActiveSpan(
        spanName,
        {
          kind: SpanKind.SERVER,
          attributes: {
            'http.method': method,
            'http.url': url.href,
            'http.route': path,
            'http.host': url.hostname,
            'http.scheme': url.protocol.replace(':', ''),
            'http.user_agent': req.headers.get('user-agent') ?? '',
            'http.request_id': req.headers.get('x-request-id') ?? '',
            'net.peer.ip': req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '',
          },
        },
        async (span) => {
          const startTime = Date.now()
          try {
            // Resolve auth first so we can use userId for per-user rate limiting
            let userId: string | undefined
            if (options.auth) {
              userId = await getAuthUser(req)
              if (!userId) {
                span.setAttributes({ 'http.status_code': 401, 'enduser.id': '' })
                span.setStatus({ code: SpanStatusCode.ERROR, message: 'Unauthorized' })
                span.end()
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
              }
              span.setAttribute('enduser.id', userId)
            }

            // Apply rate limiting (per-user if authenticated, per-IP otherwise)
            if (limiter) {
              const rateLimitResponse = limiter(req, userId)
              if (rateLimitResponse) {
                span.setAttributes({ 'http.status_code': 429 })
                span.setStatus({ code: SpanStatusCode.ERROR, message: 'Rate limit exceeded' })
                span.end()
                return rateLimitResponse
              }
            }

            const response = await options.handler(req, { ...ctx, userId })
            const statusCode = response.status

            span.setAttributes({
              'http.status_code': statusCode,
              'http.response_content_length': Number(response.headers.get('content-length') ?? 0),
              'duration.ms': Date.now() - startTime,
            })
            span.setStatus({
              code: statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
            })

            // Attach rate limit headers to successful responses
            if (rateLimitConfig && limiter) {
              const headers = getRateLimitHeaders(rateLimitConfig, req, userId)
              for (const [headerName, headerValue] of Object.entries(headers)) {
                response.headers.set(headerName, headerValue)
              }
            }

            // Propagate trace ID in response so clients can correlate logs
            const traceId = span.spanContext().traceId
            if (traceId) {
              response.headers.set('x-trace-id', traceId)
            }

            span.end()
            return response
          } catch (error: unknown) {
            const durationMs = Date.now() - startTime

            if (error instanceof Error) {
              // Record the full exception on the span so Jaeger shows the stack trace
              span.recordException(error)
              span.setAttributes({
                'error.name': error.name,
                'error.message': error.message,
                'http.status_code': error.name.includes('NotFound') ? 404 : 400,
                'duration.ms': durationMs,
              })
              span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
              span.end()

              const statusCode = error.name.includes('NotFound') ? 404 : 400
              const ctor = error.constructor as unknown as Record<string, unknown>
              const code = typeof ctor?.code === 'string' ? ctor.code : undefined
              return NextResponse.json({ error: error.message, ...(code ? { code } : {}) }, { status: statusCode })
            }

            span.setAttributes({ 'http.status_code': 500, 'duration.ms': durationMs })
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Unknown error' })
            span.recordException(new Error(String(error)))
            span.end()

            return NextResponse.json({ error: 'Something unexpected went wrong. Please try again.', code: 'UNKNOWN_ERROR' }, { status: 500 })
          }
        },
      ),
    )
  }
}
