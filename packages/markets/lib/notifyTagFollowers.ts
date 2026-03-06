import { Market } from '@play-money/database'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getTagFollowers } from './getTagFollowers'

export async function notifyTagFollowers({ market }: { market: Market }) {
  if (!market.tags.length) return

  const followerIds = await getTagFollowers({ tags: market.tags })

  // Don't notify the market creator about their own market
  const recipientIds = followerIds.filter((id) => id !== market.createdBy)

  await Promise.all(
    recipientIds.map((userId) =>
      createNotification({
        userId,
        type: 'TAG_NEW_MARKET',
        actorId: market.createdBy,
        marketId: market.id,
        actionUrl: `/questions/${market.id}/${market.slug}`,
        groupKey: `tag-new-market`,
      })
    )
  )
}
