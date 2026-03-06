import { SeverityNumber, logs } from '@opentelemetry/api-logs'
import { currentSpanId, currentTraceId } from './tracer'

type LogAttributes = Record<string, string | number | boolean | null | undefined>

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const SEVERITY_MAP: Record<LogLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
}

function emit(scope: string, level: LogLevel, message: string, attrs?: LogAttributes): void {
  const logger = logs.getLogger(scope)
  const traceId = currentTraceId()
  const spanId = currentSpanId()

  logger.emit({
    severityNumber: SEVERITY_MAP[level],
    severityText: level.toUpperCase(),
    body: message,
    attributes: {
      ...(attrs ?? {}),
      ...(traceId ? { 'trace.id': traceId } : {}),
      ...(spanId ? { 'span.id': spanId } : {}),
    },
  })

  // Also write to process stdout so local development shows logs without
  // needing to open the log files.
  const ts = new Date().toISOString()
  const attrStr =
    attrs && Object.keys(attrs).length > 0
      ? ' ' + Object.entries(attrs).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')
      : ''
  const traceStr = traceId ? ` trace=${traceId}` : ''
  // eslint-disable-next-line no-console
  console.log(`[${ts}] ${level.toUpperCase().padEnd(5)} [${scope}]${traceStr} ${message}${attrStr}`)
}

/**
 * Creates a scoped logger bound to a specific service / module name.
 *
 * @example
 * const log = createLogger('markets')
 * log.info('market created', { marketId: 'abc' })
 * log.error('failed to resolve', { marketId: 'abc', reason: 'tie' })
 */
export function createLogger(scope: string) {
  return {
    debug: (message: string, attrs?: LogAttributes) => emit(scope, 'debug', message, attrs),
    info: (message: string, attrs?: LogAttributes) => emit(scope, 'info', message, attrs),
    warn: (message: string, attrs?: LogAttributes) => emit(scope, 'warn', message, attrs),
    error: (message: string, attrs?: LogAttributes) => emit(scope, 'error', message, attrs),
    fatal: (message: string, attrs?: LogAttributes) => emit(scope, 'fatal', message, attrs),
  }
}

export type Logger = ReturnType<typeof createLogger>
