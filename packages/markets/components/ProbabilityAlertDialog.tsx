'use client'

import { BellIcon, BellOffIcon, TrashIcon } from 'lucide-react'
import React, { useState } from 'react'
import { MarketOption } from '@play-money/database'
import { createMarketAlert, deleteMarketAlert, AlertDirection } from '@play-money/api-helpers/client'
import { useMarketAlerts, MARKET_ALERTS_PATH } from '@play-money/api-helpers/client/hooks'
import { Button } from '@play-money/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@play-money/ui/dialog'
import { Label } from '@play-money/ui/label'
import { Slider } from '@play-money/ui/slider'
import { useSWRConfig } from 'swr'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  marketId: string
  option: MarketOption
}

export function ProbabilityAlertDialog({ open, onOpenChange, marketId, option }: Props) {
  const { mutate } = useSWRConfig()
  const { data: alertsData } = useMarketAlerts({ marketId })
  const [threshold, setThreshold] = useState(option.probability ?? 50)
  const [direction, setDirection] = useState<AlertDirection>('ABOVE')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingAlerts = alertsData?.data.filter((a) => a.optionId === option.id) ?? []

  async function handleCreate() {
    try {
      setIsSubmitting(true)
      setError(null)
      await createMarketAlert({ marketId, optionId: option.id, threshold, direction })
      await mutate(MARKET_ALERTS_PATH(marketId))
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(alertId: string) {
    try {
      await deleteMarketAlert({ marketId, alertId })
      await mutate(MARKET_ALERTS_PATH(marketId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellIcon className="size-4" />
            Probability Alert — {option.name}
          </DialogTitle>
          <DialogDescription>
            Get notified when this option&apos;s probability crosses a threshold.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {existingAlerts.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Active Alerts</Label>
              {existingAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    {alert.direction === 'ABOVE' ? '≥' : '≤'} {alert.threshold}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(alert.id)}
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Label className="text-xs text-muted-foreground">New Alert</Label>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Direction</span>
                <div className="flex gap-1">
                  <Button
                    variant={direction === 'ABOVE' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDirection('ABOVE')}
                  >
                    Above
                  </Button>
                  <Button
                    variant={direction === 'BELOW' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDirection('BELOW')}
                  >
                    Below
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Threshold</span>
                <span className="text-sm font-bold">{threshold}%</span>
              </div>
              <Slider
                min={1}
                max={99}
                step={1}
                value={[threshold]}
                onValueChange={([val]) => setThreshold(val)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Alert when <strong>{option.name}</strong> goes {direction === 'ABOVE' ? 'above' : 'below'}{' '}
                <strong>{threshold}%</strong>
                {option.probability != null ? ` (currently ${option.probability}%)` : ''}
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            <BellIcon className="mr-1.5 size-3.5" />
            Set Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
