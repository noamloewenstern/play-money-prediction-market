import groupBy from 'lodash/groupBy'
import orderBy from 'lodash/orderBy'

const ROOT_KEY = 'ROOT'

export function flattenReplies<C extends { id: string; parentId?: string | null; pinnedAt?: Date | string | null }>(
  comments: Array<C>
) {
  const grouped = groupBy(comments, ({ parentId }) => parentId || ROOT_KEY)

  const buildFlatReplies = (comment: C) => {
    let flatReplies: Array<C> = []
    const children = grouped[comment.id] || []

    for (const child of children) {
      flatReplies.push(child)
      flatReplies = flatReplies.concat(buildFlatReplies(child))
    }

    return orderBy(flatReplies, 'createdAt', 'asc')
  }

  const topLevelComments = grouped[ROOT_KEY] || []

  const withReplies = topLevelComments.map((comment) => ({
    ...comment,
    replies: buildFlatReplies(comment),
  }))

  const pinned = orderBy(
    withReplies.filter((c) => c.pinnedAt),
    'pinnedAt',
    'asc'
  )
  const unpinned = orderBy(
    withReplies.filter((c) => !c.pinnedAt),
    'createdAt',
    'desc'
  )

  return [...pinned, ...unpinned]
}
