import { Prisma } from '@prisma/client'
import Decimal from 'decimal.js'
import db from '@play-money/database'
import { LeaderboardUser } from '@play-money/finance/types'

function transformUserOutput(input: LeaderboardUser): LeaderboardUser {
  return {
    ...input,
    total: new Decimal(input.total).round().toNumber(),
    rank: Number(input.rank),
  }
}

export async function getGroupLeaderboard({
  listId,
}: {
  listId: string
}): Promise<{ traders: Array<LeaderboardUser> }> {
  // Get all market IDs in this list
  const marketLists = await db.marketList.findMany({
    where: { listId },
    select: { marketId: true },
  })

  const marketIds = marketLists.map((ml) => ml.marketId)

  if (marketIds.length === 0) {
    return { traders: [] }
  }

  // Get all member user IDs
  const members = await db.groupMember.findMany({
    where: { listId },
    select: { userId: true },
  })

  const memberUserIds = members.map((m) => m.userId)

  if (memberUserIds.length === 0) {
    return { traders: [] }
  }

  const traders = await db.$queryRaw<Array<LeaderboardUser>>`
    WITH trader_transactions AS (
      SELECT
        a.id AS "accountId",
        SUM(CASE
          WHEN te."fromAccountId" = a.id THEN -te.amount
          WHEN te."toAccountId" = a.id THEN te.amount
          ELSE 0
        END) as net_amount
      FROM "Transaction" t
      JOIN "TransactionEntry" te ON t.id = te."transactionId"
      JOIN "Account" a ON a.id IN (te."fromAccountId", te."toAccountId")
      WHERE t."marketId" IN (${Prisma.join(marketIds)})
        AND t.type IN ('TRADE_WIN', 'TRADE_SELL', 'TRADE_BUY')
        AND te."assetType" = 'CURRENCY'
        AND a.type = 'USER'
      GROUP BY a.id
    )
    SELECT
      u.id as "userId",
      u."displayName",
      u."username",
      u."avatarUrl",
      COALESCE(tt.net_amount, 0) as total,
      RANK() OVER (ORDER BY COALESCE(tt.net_amount, 0) DESC) as rank
    FROM "User" u
    JOIN "GroupMember" gm ON gm."userId" = u.id AND gm."listId" = ${listId}
    LEFT JOIN trader_transactions tt ON u."primaryAccountId" = tt."accountId"
    ORDER BY total DESC
  `

  return { traders: traders.map(transformUserOutput) }
}
