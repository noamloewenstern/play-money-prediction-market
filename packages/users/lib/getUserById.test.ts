import '@play-money/config/jest/jest-setup'
import { mockUser } from '@play-money/database/mocks'
import db from '@play-money/database'
import { getUserById } from './getUserById'
import { UserNotFoundError } from './exceptions'

describe('getUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user when found', async () => {
    const user = mockUser({ id: 'user-1' })
    jest.mocked(db.user.findUnique).mockResolvedValue(user)

    const result = await getUserById({ id: 'user-1' })

    expect(result).toEqual(user)
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    })
  })

  it('should throw UserNotFoundError when not found', async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(null)

    await expect(getUserById({ id: 'nonexistent' })).rejects.toThrow('User with id "nonexistent" not found')
  })
})
