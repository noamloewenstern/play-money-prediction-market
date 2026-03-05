import DOMPurify from 'isomorphic-dompurify'
import '@play-money/config/jest/jest-setup'
import { mockComment, mockMarket } from '@play-money/database/mocks'
import db from '@play-money/database'
import { getMarket } from '@play-money/markets/lib/getMarket'
import { getUniqueLiquidityProviderIds } from '@play-money/markets/lib/getUniqueLiquidityProviderIds'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { createDailyCommentBonusTransaction } from '@play-money/quests/lib/createDailyCommentBonusTransaction'
import { hasCommentedToday } from '@play-money/quests/lib/helpers'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { createComment } from './createComment'

jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((content: string) => content),
  },
}))
jest.mock('@play-money/markets/lib/getMarket')
jest.mock('@play-money/markets/lib/getUniqueLiquidityProviderIds')
jest.mock('@play-money/notifications/lib/createNotification')
jest.mock('@play-money/quests/lib/createDailyCommentBonusTransaction')
jest.mock('@play-money/quests/lib/helpers')
jest.mock('@play-money/users/lib/getUserPrimaryAccount')
jest.mock('@play-money/lists/lib/getList')

describe('createComment', () => {
  const market = mockMarket({ id: 'market-1', slug: 'test-market' })

  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(DOMPurify.sanitize).mockImplementation((content) => content as string)
    jest.mocked(getMarket).mockResolvedValue(market as any)
    jest.mocked(getUniqueLiquidityProviderIds).mockResolvedValue([])
    jest.mocked(createNotification).mockResolvedValue(undefined as any)
    jest.mocked(hasCommentedToday).mockResolvedValue(true)
  })

  it('should create a comment with valid data', async () => {
    const comment = mockComment({
      id: 'comment-1',
      content: '<p>Hello world</p>',
      authorId: 'author-1',
      entityType: 'MARKET',
      entityId: 'market-1',
      parentId: null,
    })

    jest.mocked(db.comment.create).mockResolvedValue(comment as any)
    jest.mocked(db.market.update).mockResolvedValue(market as any)

    const result = await createComment({
      content: '<p>Hello world</p>',
      authorId: 'author-1',
      parentId: null,
      entityType: 'MARKET',
      entityId: 'market-1',
    })

    expect(result).toEqual(comment)
    expect(db.comment.create).toHaveBeenCalledWith({
      data: {
        content: '<p>Hello world</p>',
        authorId: 'author-1',
        parentId: null,
        entityType: 'MARKET',
        entityId: 'market-1',
      },
      include: { parent: true },
    })
  })

  it('should sanitize HTML content', async () => {
    const comment = mockComment({ id: 'comment-1', entityType: 'MARKET', entityId: 'market-1' })
    jest.mocked(DOMPurify.sanitize).mockReturnValue('<p>clean</p>')
    jest.mocked(db.comment.create).mockResolvedValue(comment as any)
    jest.mocked(db.market.update).mockResolvedValue(market as any)

    await createComment({
      content: '<p>dirty<script>alert("xss")</script></p>',
      authorId: 'author-1',
      parentId: null,
      entityType: 'MARKET',
      entityId: 'market-1',
    })

    expect(DOMPurify.sanitize).toHaveBeenCalledWith('<p>dirty<script>alert("xss")</script></p>', {
      ADD_TAGS: ['mention'],
      ADD_ATTR: ['data-id'],
    })
  })

  it('should extract mentions and create notifications', async () => {
    const contentWithMention = '<p>Hey <mention data-id="mentioned-user">@user</mention></p>'
    jest.mocked(DOMPurify.sanitize).mockReturnValue(contentWithMention)

    const comment = mockComment({
      id: 'comment-1',
      content: contentWithMention,
      authorId: 'author-1',
      entityType: 'MARKET',
      entityId: 'market-1',
      parentId: null,
    })
    jest.mocked(db.comment.create).mockResolvedValue(comment as any)
    jest.mocked(db.market.update).mockResolvedValue(market as any)

    await createComment({
      content: contentWithMention,
      authorId: 'author-1',
      parentId: null,
      entityType: 'MARKET',
      entityId: 'market-1',
    })

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'COMMENT_MENTION',
        actorId: 'author-1',
        userId: 'mentioned-user',
        commentId: 'comment-1',
      })
    )
  })

  it('should increment market comment count for MARKET entity type', async () => {
    const comment = mockComment({
      id: 'comment-1',
      entityType: 'MARKET',
      entityId: 'market-1',
      parentId: null,
    })
    jest.mocked(db.comment.create).mockResolvedValue(comment as any)
    jest.mocked(db.market.update).mockResolvedValue(market as any)

    await createComment({
      content: '<p>test</p>',
      authorId: 'author-1',
      parentId: null,
      entityType: 'MARKET',
      entityId: 'market-1',
    })

    expect(db.market.update).toHaveBeenCalledWith({
      where: { id: 'market-1' },
      data: {
        commentCount: { increment: 1 },
        updatedAt: expect.any(Date),
      },
    })
  })
})
