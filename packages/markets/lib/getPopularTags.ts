import { Prisma } from '@prisma/client'
import db from '@play-money/database'

export async function getPopularTags({
  excludeTag,
  limit = 10,
}: { excludeTag?: string; limit?: number } = {}): Promise<Array<{ tag: string; count: number }>> {
  const excludeClause = excludeTag ? Prisma.sql`AND tag != ${excludeTag}` : Prisma.empty

  const results = await db.$queryRaw<Array<{ tag: string; count: bigint }>>`
    SELECT tag, COUNT(*) as count
    FROM "Market", unnest(tags) AS tag
    WHERE "parentListId" IS NULL
      AND "canceledAt" IS NULL
      ${excludeClause}
    GROUP BY tag
    ORDER BY count DESC
    LIMIT ${limit}
  `

  return results.map((r) => ({ tag: r.tag, count: Number(r.count) }))
}
