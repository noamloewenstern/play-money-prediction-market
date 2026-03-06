import { EvidenceType } from '@prisma/client'
import db from '@play-money/database'
import { createLogger, withSpan } from '@play-money/telemetry'
import { getMarket } from './getMarket'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getUniqueLiquidityProviderIds } from './getUniqueLiquidityProviderIds'

const log = createLogger('markets')

export async function createEvidence({
  marketId,
  authorId,
  title,
  content,
  url,
  evidenceType,
}: {
  marketId: string
  authorId: string
  title: string
  content: string
  url?: string
  evidenceType?: EvidenceType
}) {
  return withSpan(
    'markets.createEvidence',
    async (span) => {
      span.setAttributes({
        'market.id': marketId,
        'user.author_id': authorId,
        'evidence.type': evidenceType ?? 'NEUTRAL',
        'evidence.has_url': Boolean(url),
        'evidence.title_length': title.length,
        'evidence.content_length': content.length,
      })

      log.info('createEvidence started', { marketId, authorId, evidenceType: evidenceType ?? 'NEUTRAL' })

      const market = await getMarket({ id: marketId })

      const evidence = await db.marketEvidence.create({
        data: {
          marketId,
          authorId,
          title,
          content,
          url,
          evidenceType: evidenceType ?? 'NEUTRAL',
        },
        include: {
          author: true,
          votes: true,
        },
      })

      span.setAttribute('evidence.id', evidence.id)

      const recipientIds = await getUniqueLiquidityProviderIds(marketId, [authorId])
      if (market.createdBy !== authorId) {
        recipientIds.push(market.createdBy)
      }

      span.setAttribute('evidence.notification_count', recipientIds.length)

      await Promise.all(
        recipientIds.map((recipientId) =>
          createNotification({
            type: 'MARKET_EVIDENCE_ADDED',
            actorId: authorId,
            marketId,
            groupKey: marketId,
            userId: recipientId,
            actionUrl: `/questions/${market.id}/${market.slug}#evidence`,
          })
        )
      )

      log.info('createEvidence completed', { marketId, evidenceId: evidence.id, authorId, notifiedCount: recipientIds.length })

      return evidence
    },
  )
}
