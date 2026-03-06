'use client'

import { ShieldCheckIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Card } from '@play-money/ui/card'
import { Checkbox } from '@play-money/ui/checkbox'
import { Label } from '@play-money/ui/label'
import { Separator } from '@play-money/ui/separator'
import { toast } from '@play-money/ui/use-toast'
import { getSkipTradeConfirmation, setSkipTradeConfirmation } from '../lib/tradeConfirmation'

export function SettingsTradeConfirmationForm() {
  const [skipConfirmation, setSkipConfirmation] = useState(false)

  useEffect(() => {
    setSkipConfirmation(getSkipTradeConfirmation())
  }, [])

  const handleToggle = (checked: boolean) => {
    setSkipTradeConfirmation(checked)
    setSkipConfirmation(checked)
    toast({ title: checked ? 'Trade confirmation disabled' : 'Trade confirmation enabled' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Trading</h3>
        <p className="text-sm text-muted-foreground">Configure your trading experience and confirmation preferences.</p>
      </div>

      <Separator />

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <ShieldCheckIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="skip-trade-confirmation" className="text-base font-medium">
                  Skip trade confirmation
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, trades execute immediately without a confirmation step. Recommended only for experienced
                  traders.
                </p>
              </div>
              <Checkbox
                id="skip-trade-confirmation"
                checked={skipConfirmation}
                onCheckedChange={handleToggle}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
