/**
 * Distributed trace propagation utilities.
 *
 * These helpers allow the Next.js web app (frontend server) to propagate W3C
 * Trace Context headers to the API server so that all spans from a single
 * user request appear in the same trace in Jaeger.
 *
 * Usage (Next.js server component / server action):
 *
 *   import { getOutgoingTraceHeaders } from '@play-money/telemetry/propagation'
 *
 *   const res = await fetch(apiUrl, {
 *     headers: { ...getOutgoingTraceHeaders(), 'Content-Type': 'application/json' },
 *   })
 */

import { context, propagation, trace } from '@opentelemetry/api'

/**
 * Returns the W3C Trace Context headers (`traceparent`, optionally `tracestate`)
 * for the currently active span so they can be forwarded to downstream services.
 *
 * Returns an empty object when there is no active span (safe to spread).
 */
export function getOutgoingTraceHeaders(): Record<string, string> {
  const carrier: Record<string, string> = {}
  propagation.inject(context.active(), carrier)
  return carrier
}

/**
 * Extracts a remote trace context from incoming HTTP request headers and
 * returns an OTel `Context` that can be used as the parent for a new span.
 *
 * @param headers  Plain object or `Headers` instance with incoming headers.
 */
export function extractIncomingContext(
  headers: Record<string, string | string[] | undefined> | Headers,
): ReturnType<typeof context.active> {
  const carrier: Record<string, string> = {}

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      carrier[key] = value
    })
  } else {
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        carrier[key] = Array.isArray(value) ? value[0] : value
      }
    }
  }

  return propagation.extract(context.active(), carrier)
}

/**
 * Returns the `traceparent` header value for the active span, or `undefined`.
 * Useful for logging / response headers.
 */
export function getTraceparent(): string | undefined {
  const activeSpan = trace.getActiveSpan()
  if (!activeSpan) return undefined
  const { traceId, spanId, traceFlags } = activeSpan.spanContext()
  const flags = (traceFlags & 0x01) === 1 ? '01' : '00'
  return `00-${traceId}-${spanId}-${flags}`
}
