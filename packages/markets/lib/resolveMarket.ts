import { SpanStatusCode } from '@opentelemetry/api'
import { createAuditLog } from '@play-money/audit-log/lib/createAuditLog'
import db from '@play-money/database'
import { createLogger, getTracer } from '@play-money/telemetry'
import { getUniqueTraderIds } from '@play-money/markets/lib/getUniqueTraderIds'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getUserById } from '@play-money/users/lib/getUserById'
import { triggerWebhook } from '@play-money/webhooks/lib/triggerWebhook'
import { isMarketCanceled, isMarketResolved } from '../rules'
import { activateConditionalMarkets } from './activateConditionalMarkets'
import { createMarketExcessLiquidityTransactions } from './createMarketExcessLiquidityTransactions'
import { MarketCanceledError, MarketResolvedError } from './exceptions'
import { createMarketResolveLossTransactions } from './createMarketResolveLossTransactions'
import { createMarketResolveWinTransactions } from './createMarketResolveWinTransactions'
import { getMarket } from './getMarket'
import { getMarketBookmarkUserIds } from './getMarketBookmarkUserIds'

const log = createLogger('markets')
const tracer = getTracer('@play-money/markets')

export async function resolveMarket({
  resolverId,
  marketId,
  optionId,
  supportingLink,
}: {
  resolverId: string
  marketId: string
  optionId: string
  supportingLink?: string
}) {
  return tracer.startActiveSpan(
    'markets.resolveMarket',
    {
      attributes: {
        'market.id': marketId,
        'market.option_id': optionId,
        'user.resolver_id': resolverId,
        'market.has_supporting_link': Boolean(supportingLink),
      },
    },
    async (span) => {
      try {
        log.info('resolveMarket started', { marketId, optionId, resolverId })

        const market = await getMarket({ id: marketId, extended: true })
        const resolvingUser = await getUserById({ id: resolverId })

        span.setAttribute('market.question', market.question)

        if (isMarketResolved({ market })) {
          log.warn('resolveMarket: market already resolved', { marketId })
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Market already resolved' })
          span.end()
          throw new MarketResolvedError()
        }

        if (isMarketCanceled({ market })) {
          log.warn('resolveMarket: market already canceled', { marketId })
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Market already canceled' })
          span.end()
          throw new MarketCanceledError()
        }

        // --- Persist resolution ---
        await tracer.startActiveSpan('markets.resolveMarket.persistResolution', async (dbSpan) => {
          try {
            await db.$transaction(
              async (tx) => {
                const now = new Date()

                await tx.marketResolution.upsert({
                  where: { marketId },
                  create: {
                    marketId,
                    resolutionId: optionId,
                    supportingLink,
                    resolvedById: resolverId,
                    createdAt: now,
                    updatedAt: now,
                  },
                  update: {
                    resolutionId: optionId,
                    supportingLink,
                    resolvedById: resolverId,
                    updatedAt: now,
                  },
                })

                await tx.market.update({
                  where: { id: marketId },
                  data: { resolvedAt: now, closedAt: now, closeDate: now, updatedAt: now },
                })
              },
              {
                maxWait: 5000,
                timeout: 10000,
              }
            )
            dbSpan.setStatus({ code: SpanStatusCode.OK })
          } catch (err) {
            dbSpan.recordException(err as Error)
            dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
            throw err
          } finally {
            dbSpan.end()
          }
        })

        // --- Financial settlement ---
        log.info('resolveMarket: running settlement transactions', { marketId, optionId })

        await tracer.startActiveSpan('markets.resolveMarket.settleLoss', async (s) => {
          try {
            await createMarketResolveLossTransactions({ marketId, initiatorId: resolverId, winningOptionId: optionId })
            s.setStatus({ code: SpanStatusCode.OK })
          } catch (err) {
            s.recordException(err as Error)
            s.setStatus({ code: SpanStatusCode.ERROR })
            throw err
          } finally {
            s.end()
          }
        })

        await tracer.startActiveSpan('markets.resolveMarket.settleWin', async (s) => {
          try {
            await createMarketResolveWinTransactions({ marketId, initiatorId: resolverId, winningOptionId: optionId })
            s.setStatus({ code: SpanStatusCode.OK })
          } catch (err) {
            s.recordException(err as Error)
            s.setStatus({ code: SpanStatusCode.ERROR })
            throw err
          } finally {
            s.end()
          }
        })

        await tracer.startActiveSpan('markets.resolveMarket.settleExcessLiquidity', async (s) => {
          try {
            await createMarketExcessLiquidityTransactions({ marketId, initiatorId: resolverId })
            s.setStatus({ code: SpanStatusCode.OK })
          } catch (err) {
            s.recordException(err as Error)
            s.setStatus({ code: SpanStatusCode.ERROR })
            throw err
          } finally {
            s.end()
          }
        })

        // --- Notifications ---
        const recipientIds = await getUniqueTraderIds(marketId, [resolvingUser.id])
        span.setAttribute('market.trader_notification_count', recipientIds.length)

        await Promise.all(
          recipientIds.map((recipientId) =>
            createNotification({
              type: 'MARKET_RESOLVED',
              actorId: resolverId,
              marketId: market.id,
              marketOptionId: optionId,
              groupKey: market.id,
              userId: recipientId,
              actionUrl: `/questions/${market.id}/${market.slug}`,
            })
          )
        )

        // Notify users who bookmarked this market (excluding resolver and traders already notified)
        const bookmarkUserIds = await getMarketBookmarkUserIds({ marketId })
        const traderIdSet = new Set(recipientIds)
        const bookmarkOnlyRecipients = bookmarkUserIds.filter((id) => id !== resolvingUser.id && !traderIdSet.has(id))

        span.setAttribute('market.bookmark_notification_count', bookmarkOnlyRecipients.length)

        await Promise.all(
          bookmarkOnlyRecipients.map((recipientId) =>
            createNotification({
              type: 'MARKET_BOOKMARK_RESOLVED',
              actorId: resolverId,
              marketId: market.id,
              marketOptionId: optionId,
              groupKey: market.id,
              userId: recipientId,
              actionUrl: `/questions/${market.id}/${market.slug}`,
            })
          )
        )

        const resolvedOption = market.options.find((o) => o.id === optionId)

        await createAuditLog({
          action: 'MARKET_RESOLVE',
          actorId: resolverId,
          targetType: 'Market',
          targetId: marketId,
          before: { resolvedAt: null },
          after: { resolvedAt: new Date().toISOString(), resolutionOptionId: optionId, resolutionOptionName: resolvedOption?.name },
          metadata: { marketQuestion: market.question, supportingLink },
        })

        void triggerWebhook({
          eventType: 'MARKET_RESOLVED',
          marketId,
          payload: {
            marketId,
            question: market.question,
            resolverId,
            optionId,
            optionName: resolvedOption?.name,
            supportingLink,
          },
        })

        // Activate or auto-cancel any conditional markets that depend on this one
        if (resolvedOption?.name) {
          void activateConditionalMarkets({
            parentMarketId: marketId,
            resolvedOptionName: resolvedOption.name,
            resolverId,
          })
        }

        log.info('resolveMarket completed', { marketId, optionId, resolverId, optionName: resolvedOption?.name })
        span.setAttribute('market.resolved_option_name', resolvedOption?.name ?? '')
        span.setStatus({ code: SpanStatusCode.OK })
        span.end()
      } catch (err) {
        log.error('resolveMarket failed', { marketId, optionId, resolverId, error: String(err) })
        if (err instanceof Error) span.recordException(err)
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
        span.end()
        throw err
      }
    },
  )
}
