// Core SDK initialisation
export { initSdk, getSdkLoggerProvider } from './lib/sdk'
export type { SdkConfig } from './lib/sdk'

// Tracer utilities
export { getTracer, withSpan, currentSpan, currentTraceId, currentSpanId } from './lib/tracer'

// Structured logger
export { createLogger } from './lib/logger'
export type { Logger } from './lib/logger'

// Distributed trace propagation
export { getOutgoingTraceHeaders, extractIncomingContext, getTraceparent } from './lib/propagation'

// Fetch with automatic trace header injection
export { fetchWithTrace } from './lib/fetchWithTrace'

// Re-export key OTEL API primitives so consumers don't need a direct dep
export { trace, context, propagation, SpanStatusCode, SpanKind } from '@opentelemetry/api'
export type { Span, Tracer, Context } from '@opentelemetry/api'
