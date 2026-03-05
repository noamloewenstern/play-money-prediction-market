import Decimal from 'decimal.js'
import '@play-money/config/jest/jest-setup'
import { mockAccount, mockBalance, mockMarket } from '@play-money/database/mocks'
import db from '@play-money/database'
import { getBalance } from '@play-money/finance/lib/getBalances'
import { createMarket } from '@play-money/markets/lib/createMarket'
import { getMarketTagsLLM } from '@play-money/markets/lib/getMarketTagsLLM'
import { getUserPrimaryAccount } from '@play-money/users/lib/getUserPrimaryAccount'
import { createList } from './createList'
import { calculateTotalCost } from './helpers'

jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: { sanitize: jest.fn((content: string) => content) },
}))
jest.mock('@play-money/finance/lib/getBalances')
jest.mock('@play-money/markets/lib/createMarket')
jest.mock('@play-money/markets/lib/getMarketTagsLLM')
jest.mock('@play-money/users/lib/getUserPrimaryAccount')
jest.mock('./helpers')

describe('createList', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(getUserPrimaryAccount).mockResolvedValue(mockAccount({ id: 'user-account' }))
    jest.mocked(calculateTotalCost).mockReturnValue(1000)
    jest.mocked(getBalance).mockResolvedValue(
      mockBalance({ total: new Decimal(5000), assetType: 'CURRENCY', assetId: 'PRIMARY' })
    )
    jest.mocked(getMarketTagsLLM).mockResolvedValue(['tag1', 'tag2'])
    jest.mocked(createMarket).mockResolvedValue(mockMarket() as any)
  })

  it('should create a list with valid data', async () => {
    const listData = {
      id: 'list-1',
      title: 'Test List',
      slug: 'test-list',
      ownerId: 'owner-1',
      markets: [],
    }

    jest.mocked(db.list.create).mockResolvedValue(listData as any)
    jest.mocked(db.list.findFirstOrThrow).mockResolvedValue({ ...listData, markets: [{ market: mockMarket() }] } as any)

    const result = await createList({
      title: 'Test List',
      ownerId: 'owner-1',
      closeDate: new Date('2025-01-01'),
      markets: [{ name: 'Will X happen?' }],
      contributionPolicy: 'OWNERS_ONLY',
    })

    expect(db.list.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Test List',
        ownerId: 'owner-1',
      }),
      include: { markets: { include: { market: true } } },
    })
    expect(createMarket).toHaveBeenCalledTimes(1)
    expect(result).toBeDefined()
  })

  it('should throw when markets array is empty', async () => {
    await expect(
      createList({
        title: 'Empty List',
        ownerId: 'owner-1',
        closeDate: new Date('2025-01-01'),
        markets: [],
        contributionPolicy: 'OWNERS_ONLY',
      })
    ).rejects.toThrow('List must have at least one market')
  })

  it('should throw when user does not have enough balance', async () => {
    jest.mocked(getBalance).mockResolvedValue(mockBalance({ total: new Decimal(10) }))

    await expect(
      createList({
        title: 'Expensive List',
        ownerId: 'owner-1',
        closeDate: new Date('2025-01-01'),
        markets: [{ name: 'Market 1' }],
        contributionPolicy: 'OWNERS_ONLY',
      })
    ).rejects.toThrow('User does not have enough balance to create list')
  })

  it('should use provided tags instead of generating them', async () => {
    jest.mocked(db.list.create).mockResolvedValue({ id: 'list-1' } as any)
    jest.mocked(db.list.findFirstOrThrow).mockResolvedValue({ id: 'list-1', markets: [] } as any)

    await createList({
      title: 'Tagged List',
      tags: ['custom-tag'],
      ownerId: 'owner-1',
      closeDate: new Date('2025-01-01'),
      markets: [{ name: 'Market 1' }],
      contributionPolicy: 'OWNERS_ONLY',
    })

    expect(getMarketTagsLLM).not.toHaveBeenCalled()
    expect(db.list.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: ['custom-tag'],
        }),
      })
    )
  })
})
