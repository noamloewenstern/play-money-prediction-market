import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { createRouteHandler } from '@play-money/api-helpers/lib/routeHandler'
import { createWebhook } from '@play-money/webhooks/lib/createWebhook'
import { getWebhooks } from '@play-money/webhooks/lib/getWebhooks'
import schema from './schema'

export const dynamic = 'force-dynamic'

export const GET = createRouteHandler({
  auth: true,
  rateLimit: 'read',
  handler: async (_req, { userId }): Promise<SchemaResponse<typeof schema.get.responses>> => {
    const webhooks = await getWebhooks({ userId })

    return NextResponse.json({ data: webhooks })
  },
})

export const POST = createRouteHandler({
  auth: true,
  rateLimit: 'write',
  handler: async (req, { userId }): Promise<SchemaResponse<typeof schema.post.responses>> => {
    const body = (await req.json()) as unknown
    const { url, events } = schema.post.requestBody.parse(body)

    const webhook = await createWebhook({ userId, url, events })

    return NextResponse.json({ data: webhook })
  },
})
