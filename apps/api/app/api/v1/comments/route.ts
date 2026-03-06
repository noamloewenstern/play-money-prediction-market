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
    const { poll, ...data } = schema.post.requestBody.parse(body)

    const comment = await createComment({
      ...data,
      authorId: userId,
      poll: poll
        ? {
            question: poll.question,
            options: poll.options,
            closesAt: poll.closesAt ? new Date(poll.closesAt) : null,
          }
        : undefined,
    })

    return NextResponse.json({ data: comment })
  },
})
