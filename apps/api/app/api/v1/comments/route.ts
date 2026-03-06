import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { createRouteHandler } from '@play-money/api-helpers/lib/routeHandler'
import { createComment } from '@play-money/comments/lib/createComment'
import schema from './schema'

export const dynamic = 'force-dynamic'

export const POST = createRouteHandler({
  auth: true,
  rateLimit: 'write',
  handler: async (req, { userId }): Promise<SchemaResponse<typeof schema.post.responses>> => {
    const body = (await req.json()) as unknown
    const data = schema.post.requestBody.parse(body)

    const comment = await createComment({ ...data, authorId: userId })

    return NextResponse.json({ data: comment })
  },
})
