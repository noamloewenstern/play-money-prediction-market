import fs from 'fs'
import path from 'path'
import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { LogRecordExporter, ReadableLogRecord } from '@opentelemetry/sdk-logs'

const SEVERITY_TEXT: Record<number, string> = {
  1: 'TRACE',
  5: 'DEBUG',
  9: 'INFO',
  13: 'WARN',
  17: 'ERROR',
  21: 'FATAL',
}

function severityText(num: number | undefined): string {
  if (num === undefined) return 'INFO'
  // Find the closest severity bracket
  const keys = Object.keys(SEVERITY_TEXT)
    .map(Number)
    .sort((a, b) => a - b)
  for (let i = keys.length - 1; i >= 0; i--) {
    if (num >= keys[i]) return SEVERITY_TEXT[keys[i]]
  }
  return 'TRACE'
}

/**
 * FileLogExporter writes log records to two files:
 * - app.jsonl: raw JSON log record per line (OTEL-compatible)
 * - app.log:   human-readable text
 */
export class FileLogExporter implements LogRecordExporter {
  private readonly jsonlPath: string
  private readonly textPath: string

  constructor(logDir: string) {
    fs.mkdirSync(logDir, { recursive: true })
    this.jsonlPath = path.join(logDir, 'app.jsonl')
    this.textPath = path.join(logDir, 'app.log')
  }

  export(logs: Array<ReadableLogRecord>, resultCallback: (result: ExportResult) => void): void {
    try {
      const jsonLines: Array<string> = []
      const textLines: Array<string> = []

      for (const log of logs) {
        const ts = log.hrTime ? new Date(log.hrTime[0] * 1000 + log.hrTime[1] / 1_000_000).toISOString() : new Date().toISOString()
        const level = severityText(log.severityNumber)
        const body = typeof log.body === 'string' ? log.body : JSON.stringify(log.body)
        const traceId = log.spanContext?.()?.traceId
        const spanId = log.spanContext?.()?.spanId
        const attrs = log.attributes ?? {}

        // JSON record
        const jsonRecord = {
          timestamp: ts,
          severity: level,
          body,
          traceId,
          spanId,
          attributes: attrs,
          resource: log.resource?.attributes ?? {},
        }
        jsonLines.push(JSON.stringify(jsonRecord))

        // Human-readable record
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(' ')
        const traceStr = traceId ? ` trace=${traceId}` : ''
        const spanStr = spanId ? ` span=${spanId}` : ''
        textLines.push(`[${ts}] ${level}${traceStr}${spanStr} ${body}${attrStr ? ' ' + attrStr : ''}`)
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
