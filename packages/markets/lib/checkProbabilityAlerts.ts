import db from '@play-money/database'
import { createNotification } from '@play-money/notifications/lib/createNotification'

export async function checkProbabilityAlerts() {
  // Find all active alerts where the market option exists
  const activeAlerts = await db.probabilityAlert.findMany({
    where: { isActive: true },
    include: {
      option: true,
      market: true,
    },
  })

  if (activeAlerts.length === 0) {
    return { checked: 0, triggered: 0 }
  }

  let triggered = 0

  await Promise.all(
    activeAlerts.map(async (alert) => {
      const currentProbability = alert.option.probability ?? 0

      const shouldTrigger =
        alert.direction === 'ABOVE'
          ? currentProbability >= alert.threshold
          : currentProbability <= alert.threshold

      if (!shouldTrigger) return

      // Mark alert as triggered (deactivate it so it doesn't fire again)
      await db.probabilityAlert.update({
        where: { id: alert.id },
        data: {
          isActive: false,
          triggeredAt: new Date(),
        },
      })

      triggered++

      await createNotification({
        type: 'MARKET_PROBABILITY_ALERT',
        userId: alert.userId,
        marketId: alert.marketId,
        marketOptionId: alert.optionId,
        groupKey: `${alert.marketId}-${alert.optionId}-alert`,
        actionUrl: `/questions/${alert.market.id}/${alert.market.slug}`,
      })
    })
  )

  return { checked: activeAlerts.length, triggered }
}
