import db from '@play-money/database'
import { signPayload } from './signPayload'

const MAX_ATTEMPTS = 5
const INITIAL_BACKOFF_MS = 1000

function getBackoffMs(attempt: number): number {
  return INITIAL_BACKOFF_MS * Math.pow(2, attempt)
}

export async function deliverWebhook({ deliveryId }: { deliveryId: string }) {
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  })

  if (!delivery) {
    return
  }

  const payloadString = JSON.stringify(delivery.payload)
  const signature = signPayload(payloadString, delivery.webhook.secret)
  const timestamp = Math.floor(Date.now() / 1000).toString()

  let statusCode: number | null = null
  let lastError: string | null = null
  let status: string = 'failed'

  try {
    const response = await fetch(delivery.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Id': delivery.id,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10_000),
    })

    statusCode = response.status

    if (response.ok) {
      status = 'success'
    } else {
      lastError = `HTTP ${response.status}`
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'Unknown error'
  }

  const newAttempts = delivery.attempts + 1

  if (status === 'failed' && newAttempts < MAX_ATTEMPTS) {
    const nextRetry = new Date(Date.now() + getBackoffMs(newAttempts))
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'pending',
        statusCode,
        attempts: newAttempts,
        lastError,
        nextRetry,
      },
    })
  } else {
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        statusCode,
        attempts: newAttempts,
        lastError,
        nextRetry: null,
      },
    })
  }
}
