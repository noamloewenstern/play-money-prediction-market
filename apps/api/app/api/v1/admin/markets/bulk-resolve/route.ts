import { NextResponse } from 'next/server'
import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import { getAuthUser } from '@play-money/auth/lib/getAuthUser'
import { cancelMarket } from '@play-money/markets/lib/cancelMarket'
import { getMarket } from '@play-money/markets/lib/getMarket'
import { resolveMarket } from '@play-money/markets/lib/resolveMarket'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'

export const dynamic = 'force-dynamic'

type RawBulkOperation = {
  marketId: string
  action: string
  optionId?: string
  supportingLink?: string
  reason?: string
}

type BulkResult = {
  marketId: string
  action: string
  success: boolean
  error?: string
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getUserById({ id: userId })
    if (!isAdmin({ user: adminUser })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as { operations: Array<RawBulkOperation> }

    if (!Array.isArray(body.operations) || body.operations.length === 0) {
      return NextResponse.json({ error: 'operations array is required and must not be empty' }, { status: 400 })
    }

    if (body.operations.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 operations per request' }, { status: 400 })
    }

    const results: Array<BulkResult> = []

    for (const op of body.operations) {
      if (!op.marketId || !op.action) {
        results.push({
          marketId: String(op.marketId ?? ''),
          action: String(op.action ?? 'unknown'),
          success: false,
          error: 'marketId and action are required',
        })
        continue
      }

      try {
        if (op.action === 'resolve') {
          if (!op.optionId) {
            results.push({ marketId: op.marketId, action: 'resolve', success: false, error: 'optionId is required' })
            continue
          }

          const market = await getMarket({ id: op.marketId, extended: true })

          await resolveMarket({
            resolverId: userId,
            marketId: op.marketId,
            optionId: op.optionId!,
            supportingLink: op.supportingLink,
          })

          await createAuditLog({
            action: 'MARKET_RESOLVE',
            actorId: userId,
            targetType: 'MARKET',
            targetId: op.marketId,
            after: { optionId: op.optionId!, supportingLink: op.supportingLink ?? null },
            metadata: {
              reason: op.reason ?? 'Admin bulk force-resolve',
              question: market.question,
              bulkOperation: true,
            },
          })

          results.push({ marketId: op.marketId, action: 'resolve', success: true })
        } else if (op.action === 'cancel') {
          if (!op.reason) {
            results.push({ marketId: op.marketId, action: 'cancel', success: false, error: 'reason is required' })
            continue
          }

          await cancelMarket({
            canceledById: userId,
            marketId: op.marketId,
            reason: op.reason,
          })

          results.push({ marketId: op.marketId, action: 'cancel', success: true })
        } else {
          results.push({
            marketId: op.marketId,
            action: String(op.action),
            success: false,
            error: 'Invalid action. Must be "resolve" or "cancel"',
          })
        }
      } catch (error) {
        results.push({
          marketId: op.marketId,
          action: String(op.action),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      data: {
        results,
        summary: { total: results.length, succeeded: successCount, failed: failureCount },
      },
    })
  } catch (error) {
    console.log(error) // eslint-disable-line no-console -- Log error for debugging
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
