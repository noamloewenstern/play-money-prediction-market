'use client'

import { BellOffIcon, MoonIcon } from 'lucide-react'
import React, { useCallback } from 'react'
import { updateMyQuietHours } from '@play-money/api-helpers/client'
import { useMyQuietHours, MY_QUIET_HOURS_PATH } from '@play-money/api-helpers/client/hooks'
import { Button } from '@play-money/ui/button'
import { Card } from '@play-money/ui/card'
import { Checkbox } from '@play-money/ui/checkbox'
import { Label } from '@play-money/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@play-money/ui/select'
import { Separator } from '@play-money/ui/separator'
import { toast } from '@play-money/ui/use-toast'
import { useUser } from '@play-money/users/context/UserContext'
import { mutate } from 'swr'

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM'
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function SettingsQuietHoursForm() {
  const { user } = useUser()
  const { data, mutate: mutateQuietHours } = useMyQuietHours({ skip: !user })
  const settings = data?.data

  const handleToggleQuietHours = useCallback(
    async (checked: boolean) => {
      try {
        const update: Record<string, unknown> = { quietHoursEnabled: checked }
        if (checked && settings?.quietHoursStart == null) {
          update.quietHoursStart = 22
          update.quietHoursEnd = 8
        }
        await updateMyQuietHours(update)
        void mutateQuietHours()
        void mutate(MY_QUIET_HOURS_PATH)
        toast({ title: checked ? 'Quiet hours enabled' : 'Quiet hours disabled' })
      } catch (error) {
        toast({ title: 'Failed to update quiet hours', description: (error as Error).message, variant: 'destructive' })
      }
    },
    [settings, mutateQuietHours]
  )

  const handleToggleDND = useCallback(async (checked: boolean) => {
    try {
      await updateMyQuietHours({ doNotDisturb: checked })
      void mutateQuietHours()
      void mutate(MY_QUIET_HOURS_PATH)
      toast({ title: checked ? 'Do Not Disturb enabled' : 'Do Not Disturb disabled' })
    } catch (error) {
      toast({ title: 'Failed to update Do Not Disturb', description: (error as Error).message, variant: 'destructive' })
    }
  }, [mutateQuietHours])

  const handleUpdateHour = useCallback(
    async (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
      try {
        await updateMyQuietHours({ [field]: parseInt(value, 10) })
        void mutateQuietHours()
        void mutate(MY_QUIET_HOURS_PATH)
      } catch (error) {
        toast({ title: 'Failed to update quiet hours', description: (error as Error).message, variant: 'destructive' })
      }
    },
    [mutateQuietHours]
  )

  if (!settings) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Quiet Hours</h3>
        <p className="text-sm text-muted-foreground">
          Set a recurring time window during which notifications are silenced. Queued notifications are delivered as a
          batch when quiet hours end.
        </p>
      </div>

      <Separator />

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <MoonIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quiet-hours-toggle" className="text-base font-medium">
                  Quiet Hours
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically silence notifications during a recurring time window
                </p>
              </div>
              <Checkbox
                id="quiet-hours-toggle"
                checked={settings.quietHoursEnabled}
                onCheckedChange={handleToggleQuietHours}
              />
            </div>

            {settings.quietHoursEnabled ? (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="start-hour" className="text-sm whitespace-nowrap">
                    From
                  </Label>
                  <Select
                    value={String(settings.quietHoursStart ?? 22)}
                    onValueChange={(v) => handleUpdateHour('quietHoursStart', v)}
                  >
                    <SelectTrigger id="start-hour" className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {formatHour(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="end-hour" className="text-sm whitespace-nowrap">
                    To
                  </Label>
                  <Select
                    value={String(settings.quietHoursEnd ?? 8)}
                    onValueChange={(v) => handleUpdateHour('quietHoursEnd', v)}
                  >
                    <SelectTrigger id="end-hour" className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {formatHour(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-muted-foreground">({settings.timezone})</span>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <BellOffIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dnd-toggle" className="text-base font-medium">
                  Do Not Disturb
                </Label>
                <p className="text-sm text-muted-foreground">
                  Manually silence all notifications right now. Queued notifications are delivered when you turn this
                  off.
                </p>
              </div>
              <Checkbox
                id="dnd-toggle"
                checked={settings.doNotDisturb}
                onCheckedChange={handleToggleDND}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
