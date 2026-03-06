import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { createRouteHandler } from '@play-money/api-helpers/lib/routeHandler'
import { getWebhookDeliveries } from '@play-money/webhooks/lib/getWebhookDeliveries'
import schema from './schema'

export const dynamic = 'force-dynamic'

export const GET = createRouteHandler({
  auth: true,
  rateLimit: 'read',
  handler: async (req, { userId, params }): Promise<SchemaResponse<typeof schema.get.responses>> => {
    const url = new URL(req.url)
    const cursor = url.searchParams.get('cursor') || undefined
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined

    const { deliveries, pageInfo } = await getWebhookDeliveries({
      webhookId: params.id,
      userId,
      cursor,
      limit,
    })

    return NextResponse.json({ data: deliveries, pageInfo })
  },
})
