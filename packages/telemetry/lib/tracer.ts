import { Span, SpanStatusCode, Tracer, context, trace } from '@opentelemetry/api'

const INSTRUMENTATION_SCOPE = '@play-money/telemetry'

/**
 * Returns a named tracer for the given scope.
 * Prefer using the service-level tracer from getTracer() for most spans.
 */
export function getTracer(scope = INSTRUMENTATION_SCOPE): Tracer {
  return trace.getTracer(scope)
}

/**
 * Convenience helper: run `fn` inside a new span.
 * Automatically sets the span status to ERROR and records the exception if `fn` throws.
 *
 * @example
 * const result = await withSpan('db.query', async (span) => {
 *   span.setAttribute('db.statement', sql)
 *   return db.query(sql)
 * })
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  options?: Parameters<Tracer['startActiveSpan']>[1],
): Promise<T> {
  const tracer = getTracer()
  return tracer.startActiveSpan(name, options ?? {}, async (span) => {
    try {
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
      if (err instanceof Error) {
        span.recordException(err)
      }
      throw err
    } finally {
      span.end()
    }
  })
}

/**
 * Returns the currently active span (may be a no-op span if none is active).
 */
export function currentSpan(): Span {
  return trace.getActiveSpan() ?? trace.getSpan(context.active())!
}

/**
 * Returns the trace ID of the active span, or undefined.
 */
export function currentTraceId(): string | undefined {
  const span = trace.getActiveSpan()
  if (!span) return undefined
  const ctx = span.spanContext()
  return ctx.traceId !== '00000000000000000000000000000000' ? ctx.traceId : undefined
}

/**
 * Returns the span ID of the active span, or undefined.
 */
export function currentSpanId(): string | undefined {
  const span = trace.getActiveSpan()
  return span?.spanContext().spanId
}
