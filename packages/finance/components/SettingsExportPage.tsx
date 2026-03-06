'use client'

import { Download } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@play-money/ui/button'
import { Card, CardContent } from '@play-money/ui/card'
import { toast } from '@play-money/ui/use-toast'

type ExportType = 'transactions' | 'positions' | 'markets'
type ExportFormat = 'csv' | 'json'

const EXPORT_OPTIONS: Array<{ type: ExportType; title: string; description: string }> = [
  {
    type: 'transactions',
    title: 'Transaction History',
    description: 'All your trades, bonuses, and other transactions.',
  },
  {
    type: 'positions',
    title: 'Portfolio Positions',
    description: 'Your current and past positions across all markets.',
  },
  {
    type: 'markets',
    title: 'Created Markets',
    description: 'Markets you have created, including status and stats.',
  },
]

async function downloadExport(type: ExportType, format: ExportFormat) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/users/me/export?type=${type}&format=${format}`,
    { credentials: 'include' }
  )

  if (!res.ok) {
    const { error } = (await res.json()) as { error: string }
    throw new Error(error || 'Export failed')
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `play-money-${type}-${new Date().toISOString().slice(0, 10)}.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function SettingsExportPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    const key = `${type}-${format}`
    setLoading(key)
    try {
      await downloadExport(type, format)
      toast({ title: `${type} exported as ${format.toUpperCase()}` })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Export Data</h1>
          <p className="mt-2 text-muted-foreground">
            Download your transaction history, portfolio positions, and created markets as CSV or JSON.
          </p>
        </div>

        {EXPORT_OPTIONS.map(({ type, title, description }) => (
          <Card key={type} className="bg-muted/50">
            <CardContent className="md:pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={loading === `${type}-csv`}
                    disabled={loading !== null}
                    onClick={() => handleExport(type, 'csv')}
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={loading === `${type}-json`}
                    disabled={loading !== null}
                    onClick={() => handleExport(type, 'json')}
                  >
                    <Download className="h-4 w-4" />
                    JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
