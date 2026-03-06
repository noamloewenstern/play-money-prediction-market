/**
 * Next.js instrumentation hook for the web (frontend) server.
 *
 * Even though the web app is primarily a frontend, Next.js runs it in a
 * Node.js server process for SSR.  We instrument it so that:
 *   - Server-side render traces are captured
 *   - `traceparent` headers are forwarded to the API, enabling end-to-end
 *     distributed tracing across the web → API boundary
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { initSdk } = await import('@play-money/telemetry')

  initSdk({
    serviceName: 'play-money-web',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://jaeger:4318/v1/traces',
    enableOtlp: process.env.OTEL_ENABLE_OTLP !== 'false',
  })
}
