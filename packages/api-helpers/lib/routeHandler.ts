import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'

type RouteContext = { params: Record<string, string> }

type HandlerContext = RouteContext & { userId?: string }

type AuthHandlerContext = RouteContext & { userId: string }

type RouteHandlerFn = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>

export function createRouteHandler(options: {
  auth: true
  handler: (req: NextRequest, ctx: AuthHandlerContext) => Promise<NextResponse>
}): RouteHandlerFn
export function createRouteHandler(options: {
  auth?: false
  handler: (req: NextRequest, ctx: HandlerContext) => Promise<NextResponse>
}): RouteHandlerFn
export function createRouteHandler(options: {
  auth?: boolean
  handler: (req: NextRequest, ctx: HandlerContext) => Promise<NextResponse>
}): RouteHandlerFn {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      let userId: string | undefined
      if (options.auth) {
        userId = await getAuthUser(req)
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
      return await options.handler(req, { ...ctx, userId })
    } catch (error: unknown) {
      console.log(error) // eslint-disable-line no-console -- Log error for debugging

      if (error instanceof Error) {
        const statusCode = error.name.includes('NotFound') ? 404 : 400
        return NextResponse.json({ error: error.message }, { status: statusCode })
      }

      return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
    }
  }
}
