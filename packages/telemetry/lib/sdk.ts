import path from 'path'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { FileLogExporter } from './exporters/fileLogExporter'
import { FileTraceExporter } from './exporters/fileTraceExporter'

export type SdkConfig = {
  /** Display name for this service in traces/logs (e.g. "api", "web") */
  serviceName: string
  /** Optional version tag */
  serviceVersion?: string
  /**
   * Directory where file-based traces and logs will be written.
   * Defaults to <cwd>/logs/<serviceName>
   */
  logDir?: string
  /**
   * OTLP HTTP endpoint for Jaeger (or any OTLP-compatible collector).
   * Falls back to the OTEL_EXPORTER_OTLP_ENDPOINT env var, then
   * http://localhost:4318/v1/traces as a last resort.
   */
  otlpEndpoint?: string
  /** Set to false to disable Jaeger/OTLP export (e.g. in tests). Default: true */
  enableOtlp?: boolean
}

let sdkInstance: NodeSDK | null = null
let loggerProvider: LoggerProvider | null = null

export function initSdk(config: SdkConfig): void {
  if (sdkInstance) return // already initialised

  const {
    serviceName,
    serviceVersion = process.env.npm_package_version ?? '0.0.0',
    logDir = path.join(process.cwd(), 'logs', serviceName),
    otlpEndpoint =
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
    enableOtlp = true,
  } = config

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': process.env.NODE_ENV ?? 'development',
  })

  // --- Span exporters ---
  const spanProcessors = [
    // Always write spans to local files (JSONL + human-readable)
    new SimpleSpanProcessor(new FileTraceExporter(logDir)),
  ]

  if (enableOtlp) {
    const otlpExporter = new OTLPTraceExporter({ url: otlpEndpoint })
    spanProcessors.push(new BatchSpanProcessor(otlpExporter))
  }

  // --- Log exporters ---
  loggerProvider = new LoggerProvider({ resource })
  loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(new FileLogExporter(logDir)))

  // --- SDK ---
  sdkInstance = new NodeSDK({
    resource,
    spanProcessors,
    logRecordProcessors: [new SimpleLogRecordProcessor(new FileLogExporter(logDir))],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Reduce noise from internal Next.js file-system calls
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          // Attach extra attributes to every HTTP span
          requestHook(span, request) {
            const req = request as { headers?: Record<string, string>; url?: string }
            if (req.headers?.['x-request-id']) {
              span.setAttribute('http.request_id', req.headers['x-request-id'])
            }
          },
        },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  })

  sdkInstance.start()

  // Graceful shutdown
  const shutdown = () => {
    sdkInstance
      ?.shutdown()
      .catch((err) => console.error('OTEL SDK shutdown error', err)) // eslint-disable-line no-console
  }
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}

export function getSdkLoggerProvider(): LoggerProvider | null {
  return loggerProvider
}
