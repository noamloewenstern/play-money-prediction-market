import fs from 'fs'
import path from 'path'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-node'

/**
 * FileTraceExporter writes spans to two files:
 * - traces.jsonl: raw OTLP-style JSON, one span per line
 * - traces.log:   human-readable text for quick grepping
 */
export class FileTraceExporter implements SpanExporter {
  private readonly jsonlPath: string
  private readonly textPath: string

  constructor(logDir: string) {
    fs.mkdirSync(logDir, { recursive: true })
    this.jsonlPath = path.join(logDir, 'traces.jsonl')
    this.textPath = path.join(logDir, 'traces.log')
  }

  export(spans: Array<ReadableSpan>, resultCallback: (result: ExportResult) => void): void {
    try {
      const jsonLines: Array<string> = []
      const textLines: Array<string> = []

      for (const span of spans) {
        const traceId = span.spanContext().traceId
        const spanId = span.spanContext().spanId
        const parentId = span.parentSpanId ?? null
        const startMs = hrTimeToMs(span.startTime)
        const endMs = hrTimeToMs(span.endTime)
        const durationMs = endMs - startMs
        const statusCode = span.status.code
        const attrs = span.attributes

        // --- JSON OTEL record ---
        const jsonRecord = {
          traceId,
          spanId,
          parentSpanId: parentId,
          name: span.name,
          kind: span.kind,
          startTime: new Date(startMs).toISOString(),
          endTime: new Date(endMs).toISOString(),
          durationMs: Math.round(durationMs),
          status: { code: statusCode, message: span.status.message },
          attributes: attrs,
          events: span.events.map((e) => ({
            name: e.name,
            time: new Date(hrTimeToMs(e.time)).toISOString(),
            attributes: e.attributes,
          })),
          resource: span.resource.attributes,
        }
        jsonLines.push(JSON.stringify(jsonRecord))

        // --- Human-readable record ---
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(' ')
        const eventsStr =
          span.events.length > 0
            ? ` events=[${span.events.map((e) => e.name).join(',')}]`
            : ''
        const statusStr = statusCode === 2 ? ' ERROR' : statusCode === 1 ? ' OK' : ''
        textLines.push(
          `[${new Date(startMs).toISOString()}] SPAN${statusStr} ${span.name} ` +
            `trace=${traceId} span=${spanId}${parentId ? ` parent=${parentId}` : ''} ` +
            `duration=${Math.round(durationMs)}ms ${attrStr}${eventsStr}`,
        )
      }

      if (jsonLines.length > 0) {
        fs.appendFileSync(this.jsonlPath, jsonLines.join('\n') + '\n')
        fs.appendFileSync(this.textPath, textLines.join('\n') + '\n')
      }

      resultCallback({ code: ExportResultCode.SUCCESS })
    } catch (err) {
      resultCallback({ code: ExportResultCode.FAILED, error: err as Error })
    }
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

function hrTimeToMs(hrTime: [number, number]): number {
  return hrTime[0] * 1000 + hrTime[1] / 1_000_000
}
