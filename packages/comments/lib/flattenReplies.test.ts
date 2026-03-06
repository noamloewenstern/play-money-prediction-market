import { flattenReplies } from './flattenReplies'

describe('flattenReplies', () => {
  it('should put pinned comments first, sorted by pinnedAt ascending', () => {
    const comments = [
      { id: '1', parentId: null, createdAt: new Date('2024-01-01'), pinnedAt: null },
      { id: '2', parentId: null, createdAt: new Date('2024-01-02'), pinnedAt: new Date('2024-02-02') },
      { id: '3', parentId: null, createdAt: new Date('2024-01-03'), pinnedAt: new Date('2024-02-01') },
      { id: '4', parentId: null, createdAt: new Date('2024-01-04'), pinnedAt: null },
    ]

    const result = flattenReplies(comments)

    // Pinned first (sorted by pinnedAt asc): 3 then 2
    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('2')
    // Unpinned next (sorted by createdAt desc): 4 then 1
    expect(result[2].id).toBe('4')
    expect(result[3].id).toBe('1')
  })

  it('should work with no pinned comments (same as before)', () => {
    const comments = [
      { id: '1', parentId: null, createdAt: new Date('2024-01-01'), pinnedAt: null },
      { id: '2', parentId: null, createdAt: new Date('2024-01-03'), pinnedAt: null },
      { id: '3', parentId: null, createdAt: new Date('2024-01-02'), pinnedAt: null },
    ]

    const result = flattenReplies(comments)

    // Sorted by createdAt desc
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
    expect(result[2].id).toBe('1')
  })

  it('should nest replies under parent comments', () => {
    const comments = [
      { id: '1', parentId: null, createdAt: new Date('2024-01-01'), pinnedAt: null },
      { id: '2', parentId: '1', createdAt: new Date('2024-01-02'), pinnedAt: null },
      { id: '3', parentId: '1', createdAt: new Date('2024-01-03'), pinnedAt: null },
    ]

    const result = flattenReplies(comments)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
    expect(result[0].replies).toHaveLength(2)
    expect(result[0].replies[0].id).toBe('2')
    expect(result[0].replies[1].id).toBe('3')
  })

  it('should handle pinned comments with replies', () => {
    const comments = [
      { id: '1', parentId: null, createdAt: new Date('2024-01-01'), pinnedAt: new Date('2024-02-01') },
      { id: '2', parentId: '1', createdAt: new Date('2024-01-02'), pinnedAt: null },
      { id: '3', parentId: null, createdAt: new Date('2024-01-03'), pinnedAt: null },
    ]

    const result = flattenReplies(comments)

    expect(result).toHaveLength(2)
    // Pinned comment first
    expect(result[0].id).toBe('1')
    expect(result[0].replies).toHaveLength(1)
    expect(result[0].replies[0].id).toBe('2')
    // Unpinned comment second
    expect(result[1].id).toBe('3')
  })
})
