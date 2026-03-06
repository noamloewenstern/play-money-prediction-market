import db, { List, Market, User } from '@play-money/database'

export type CommentSearchResult = {
  id: string
  content: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  entityType: string
  entityId: string
  entityTitle: string
  entitySlug: string
  createdAt: Date
}

type SearchResults = {
  users: Array<User>
  markets: Array<Market>
  lists: Array<List>
  tags: Array<{ tag: string; count: number }>
  comments: Array<CommentSearchResult>
}

export async function search({ query = '' }: { query?: string }): Promise<SearchResults> {
  const trimmed = query.trim()

  if (trimmed.length > 0) {
    const likePattern = `%${trimmed}%`

    const [users, markets, lists, tagsRaw, commentsRaw] = await Promise.all([
      db.$queryRaw<Array<User>>`
        SELECT *
        FROM "User"
        WHERE username ILIKE ${likePattern} OR "displayName" ILIKE ${likePattern}
        ORDER BY "createdAt" DESC
        LIMIT 5
      `,
      db.$queryRaw<Array<Market>>`
        SELECT *
        FROM "Market"
        WHERE question ILIKE ${likePattern} OR description ILIKE ${likePattern}
        ORDER BY "createdAt" DESC
        LIMIT 5
      `,
      db.$queryRaw<Array<List>>`
        SELECT *
        FROM "List"
        WHERE title ILIKE ${likePattern} OR description ILIKE ${likePattern}
        ORDER BY "createdAt" DESC
        LIMIT 5
      `,
      db.$queryRaw<Array<{ tag: string; count: bigint }>>`
        SELECT tag, COUNT(*) as count
        FROM "Market", unnest(tags) AS tag
        WHERE "parentListId" IS NULL
          AND "canceledAt" IS NULL
          AND tag ILIKE ${likePattern}
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 5
      `,
      db.$queryRaw<Array<CommentSearchResult>>`
        SELECT
          c.id,
          c.content,
          c."authorId",
          u.username AS "authorUsername",
          u."displayName" AS "authorDisplayName",
          c."entityType",
          c."entityId",
          CASE
            WHEN c."entityType" = 'MARKET' THEN m.question
            WHEN c."entityType" = 'LIST' THEN l.title
          END AS "entityTitle",
          CASE
            WHEN c."entityType" = 'MARKET' THEN m.slug
            WHEN c."entityType" = 'LIST' THEN l.slug
          END AS "entitySlug",
          c."createdAt"
        FROM "Comment" c
        JOIN "User" u ON u.id = c."authorId"
        LEFT JOIN "Market" m ON c."entityType" = 'MARKET' AND m.id = c."entityId"
        LEFT JOIN "List" l ON c."entityType" = 'LIST' AND l.id = c."entityId"
        WHERE c.hidden = false
          AND c.content ILIKE ${likePattern}
        ORDER BY c."createdAt" DESC
        LIMIT 5
      `,
    ])

    return {
      users,
      markets,
      lists,
      tags: tagsRaw.map((r) => ({ tag: r.tag, count: Number(r.count) })),
      comments: commentsRaw,
    }
  }

  const [users, markets, lists] = await Promise.all([
    db.$queryRaw<Array<User>>`
      SELECT *
      FROM "User"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `,
    db.$queryRaw<Array<Market>>`
      SELECT *
      FROM "Market"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `,
    db.$queryRaw<Array<List>>`
      SELECT *
      FROM "List"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `,
  ])

  return {
    users,
    markets,
    lists,
    tags: [],
    comments: [],
  }
}
