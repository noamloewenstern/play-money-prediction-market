'use client'

import { BellIcon, BellOffIcon } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from '@play-money/ui/use-toast'
import { Button } from '@play-money/ui/button'
import { Card } from '@play-money/ui/card'
import { Label } from '@play-money/ui/label'
import { Separator } from '@play-money/ui/separator'

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/v1/users/me/push-subscriptions`, { credentials: 'include' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data?.publicKey || null
  } catch {
    return null
  }
}

async function subscribeToPushNotifications(publicKey: string): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready

  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) return existingSubscription

  const applicationServerKey = urlBase64ToUint8Array(publicKey)
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
}

async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON()
  const body = {
    endpoint: subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh || '', auth: json.keys?.auth || '' },
    userAgent: navigator.userAgent,
  }
  const res = await fetch(`${API_URL}/v1/users/me/push-subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to save subscription')
}

async function deleteSubscriptionFromServer(endpoint: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/users/me/push-subscriptions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ endpoint }),
  })
  if (!res.ok) throw new Error('Failed to delete subscription')
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

type PushStatus = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

export function SettingsPushNotificationsForm() {
  const [status, setStatus] = useState<PushStatus>('loading')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setStatus('denied')
        return
      }
      try {
        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        setStatus(existing ? 'subscribed' : 'unsubscribed')
      } catch {
        setStatus('unsubscribed')
      }
    }
    void checkStatus()
  }, [])

  const handleSubscribe = useCallback(async () => {
    setIsUpdating(true)
    try {
      const publicKey = await getVapidPublicKey()
      if (!publicKey) {
        toast({ title: 'Push notifications not available', description: 'Server is not configured for push notifications.', variant: 'destructive' })
        return
      }

      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setStatus('denied')
        toast({ title: 'Permission denied', description: 'Please allow notifications in your browser settings.', variant: 'destructive' })
        return
      }
      if (permission !== 'granted') {
        return
      }

      const subscription = await subscribeToPushNotifications(publicKey)
      if (!subscription) {
        throw new Error('Failed to create push subscription')
      }

      await saveSubscriptionToServer(subscription)
      setStatus('subscribed')
      toast({ title: 'Push notifications enabled', description: 'You will now receive push notifications.' })
    } catch (error) {
      toast({ title: 'Failed to enable push notifications', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const handleUnsubscribe = useCallback(async () => {
    setIsUpdating(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await deleteSubscriptionFromServer(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setStatus('unsubscribed')
      toast({ title: 'Push notifications disabled' })
    } catch (error) {
      toast({ title: 'Failed to disable push notifications', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }, [])

  if (status === 'loading') return null

  if (status === 'unsupported') {
    return (
      <div>
        <h3 className="text-lg font-medium">Browser Push Notifications</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your browser does not support push notifications.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Browser Push Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Receive real-time alerts in your browser when markets resolve, trades occur, or someone replies to you.
        </p>
      </div>

      <Separator />

      <Card className="p-6">
        <div className="flex items-start gap-4">
          {status === 'subscribed' ? (
            <BellIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          ) : (
            <BellOffIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Push Notifications</Label>
                {status === 'denied' ? (
                  <p className="text-sm text-destructive">
                    Notifications are blocked. Please allow them in your browser settings and refresh.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {status === 'subscribed'
                      ? 'Push notifications are active on this device.'
                      : 'Enable push notifications for this device.'}
                  </p>
                )}
              </div>
              {status !== 'denied' && (
                <Button
                  size="sm"
                  variant={status === 'subscribed' ? 'outline' : 'default'}
                  onClick={status === 'subscribed' ? handleUnsubscribe : handleSubscribe}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : status === 'subscribed' ? 'Disable' : 'Enable'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
