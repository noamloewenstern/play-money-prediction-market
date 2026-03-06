import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import { createRouteHandler } from '@play-money/api-helpers/lib/routeHandler'
import { PollClosedError, PollOptionNotFoundError, voteOnCommentPoll } from '@play-money/comments/lib/voteOnCommentPoll'
import schema from './schema'

export const dynamic = 'force-dynamic'

export const POST = createRouteHandler({
  auth: true,
  rateLimit: 'write',
  handler: async (req, { userId, params }): Promise<SchemaResponse<typeof schema.post.responses>> => {
    const { id: _commentId } = schema.post.parameters.parse(params)
    const body = (await req.json()) as unknown
    const { pollId, optionId } = schema.post.requestBody.parse(body)

    const vote = await voteOnCommentPoll({ pollId, optionId, userId })

    if (vote === null) {
      return new Response(null, { status: 204 }) as NextResponse<Record<string, never>>
    }

    return NextResponse.json({ data: vote })
  },
})
