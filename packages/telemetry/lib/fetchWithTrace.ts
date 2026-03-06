/**
 * A thin wrapper around the native `fetch` that automatically injects W3C
 * Trace Context headers (`traceparent`, `tracestate`) so that API calls made
 * from Next.js Server Components are part of the same distributed trace as
 * the originating SSR request.
 *
 * Usage:
 *   import { fetchWithTrace } from '@play-money/telemetry/fetch'
 *
 *   const res = await fetchWithTrace('http://api:3001/v1/markets', { method: 'GET' })
 *
 * When the Node.js OTEL SDK is not initialised (e.g. in unit tests), this
 * function behaves exactly like the native `fetch` with no extra headers.
 */

import { getOutgoingTraceHeaders } from './propagation'

export function fetchWithTrace(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const traceHeaders = getOutgoingTraceHeaders()

  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...traceHeaders,
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers as Record<string, string> | undefined) ?? {}),
    },
  }

  return fetch(input, mergedInit)
}
