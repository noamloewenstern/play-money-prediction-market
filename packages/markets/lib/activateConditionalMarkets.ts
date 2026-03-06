import db from '@play-money/database'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { cancelMarket } from './cancelMarket'

/**
 * Called after a parent market resolves.
 * - If the resolved option name matches a child's conditionResolution → activate the child
 * - If the resolved option name does NOT match → auto-cancel the child
 */
export async function activateConditionalMarkets({
  parentMarketId,
  resolvedOptionName,
  resolverId,
}: {
  parentMarketId: string
  resolvedOptionName: string
  resolverId: string
}) {
  const conditionalMarkets = await db.market.findMany({
    where: {
      parentMarketId,
      resolvedAt: null,
      canceledAt: null,
    },
  })

  if (conditionalMarkets.length === 0) return

  await Promise.all(
    conditionalMarkets.map(async (childMarket) => {
      const conditionMet = (childMarket.conditionResolution ?? 'Yes').toLowerCase() === resolvedOptionName.toLowerCase()

      if (conditionMet) {
        // Activate the conditional market
        await db.market.update({
          where: { id: childMarket.id },
          data: { activatedAt: new Date() },
        })

        // Notify market creator
        await createNotification({
          type: 'CONDITIONAL_MARKET_ACTIVATED',
          actorId: resolverId,
          marketId: childMarket.id,
          groupKey: childMarket.id,
          userId: childMarket.createdBy,
          actionUrl: `/questions/${childMarket.id}/${childMarket.slug}`,
        })
      } else {
        // Auto-cancel: parent resolved to a non-matching option
        await cancelMarket({
          canceledById: resolverId,
          marketId: childMarket.id,
          reason: `Parent market resolved to "${resolvedOptionName}" — the condition "${childMarket.conditionResolution ?? 'Yes'}" was not met.`,
        })
      }
    })
  )
}
