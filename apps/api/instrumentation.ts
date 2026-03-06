/**
 * Next.js instrumentation hook (runs once per server process start).
 *
 * Next.js loads this file before any routes are compiled when
 * `experimental.instrumentationHook` is enabled in next.config.js.
 *
 * We initialise the OpenTelemetry SDK here so every API route handler
 * automatically gets traced and logged through our exporters:
 *   - Local file exporters:  logs/api/traces.jsonl + traces.log + app.jsonl + app.log
 *   - Jaeger via OTLP HTTP:  http://jaeger:4318/v1/traces  (configurable via env)
 */
export async function register() {
  // Only run in the Node.js runtime (not the Edge runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { initSdk } = await import('@play-money/telemetry')

  initSdk({
    serviceName: 'play-money-api',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://jaeger:4318/v1/traces',
    enableOtlp: process.env.OTEL_ENABLE_OTLP !== 'false',
  })
}
