import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { createRouteHandler } from '@play-money/api-helpers/lib/routeHandler'
import { deleteWebhook } from '@play-money/webhooks/lib/deleteWebhook'
import { updateWebhook } from '@play-money/webhooks/lib/updateWebhook'
import schema from './schema'

export const dynamic = 'force-dynamic'

export const PATCH = createRouteHandler({
  auth: true,
  rateLimit: 'write',
  handler: async (req, { userId, params }): Promise<SchemaResponse<typeof schema.patch.responses>> => {
    const body = (await req.json()) as unknown
    const data = schema.patch.requestBody.parse(body)

    const webhook = await updateWebhook({ id: params.id, userId, ...data })

    return NextResponse.json({ data: webhook })
  },
})

export const DELETE = createRouteHandler({
  auth: true,
  rateLimit: 'write',
  handler: async (_req, { userId, params }): Promise<SchemaResponse<typeof schema.delete.responses>> => {
    await deleteWebhook({ id: params.id, userId })

    return new NextResponse(null, { status: 204 })
  },
})
