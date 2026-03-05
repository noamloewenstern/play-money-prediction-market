import '@play-money/config/jest/jest-setup'
import { mockUser } from '@play-money/database/mocks'
import db from '@play-money/database'
import { updateUserById } from './updateUserById'
import { getUserById } from './getUserById'
import { checkUsername } from './checkUsername'

jest.mock('./getUserById')
jest.mock('./checkUsername')

describe('updateUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update user with valid data', async () => {
    const existingUser = mockUser({ id: 'user-1', username: 'oldname', bio: null })
    const updatedUser = mockUser({ id: 'user-1', username: 'oldname', bio: 'new bio' })

    jest.mocked(getUserById).mockResolvedValue(existingUser)
    jest.mocked(db.user.update).mockResolvedValue(updatedUser)

    const result = await updateUserById({ id: 'user-1', bio: 'new bio' })

    expect(result).toEqual(updatedUser)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ bio: 'new bio' }),
    })
  })

  it('should check username availability when username changes', async () => {
    const existingUser = mockUser({ id: 'user-1', username: 'oldname' })
    const updatedUser = mockUser({ id: 'user-1', username: 'newname' })

    jest.mocked(getUserById).mockResolvedValue(existingUser)
    jest.mocked(checkUsername).mockResolvedValue({ available: true, message: undefined })
    jest.mocked(db.user.update).mockResolvedValue(updatedUser)

    await updateUserById({ id: 'user-1', username: 'newname' })

    expect(checkUsername).toHaveBeenCalledWith({ username: 'newname' })
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ username: 'newname' }),
    })
  })

  it('should throw when username is not available', async () => {
    const existingUser = mockUser({ id: 'user-1', username: 'oldname' })

    jest.mocked(getUserById).mockResolvedValue(existingUser)
    jest.mocked(checkUsername).mockResolvedValue({ available: false, message: 'Username is already taken' })

    await expect(updateUserById({ id: 'user-1', username: 'taken' })).rejects.toThrow('Username is already taken')
  })

  it('should handle referrer setting and catch errors silently', async () => {
    const existingUser = mockUser({ id: 'user-1', referredBy: null })
    const updatedUser = mockUser({ id: 'user-1', referredBy: null })

    jest.mocked(getUserById).mockResolvedValueOnce(existingUser)
    jest.mocked(getUserById).mockRejectedValueOnce(new Error('User not found'))
    jest.mocked(db.user.update).mockResolvedValue(updatedUser)

    const result = await updateUserById({ id: 'user-1', referredBy: 'bad-referrer' })

    expect(result).toEqual(updatedUser)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.not.objectContaining({ referredBy: 'bad-referrer' }),
    })
  })

  it('should set referredBy when referrer exists and user has no existing referrer', async () => {
    const existingUser = mockUser({ id: 'user-1', referredBy: null })
    const referrer = mockUser({ id: 'referrer-1' })
    const updatedUser = mockUser({ id: 'user-1', referredBy: 'referrer-1' })

    jest.mocked(getUserById).mockResolvedValueOnce(existingUser)
    jest.mocked(getUserById).mockResolvedValueOnce(referrer)
    jest.mocked(db.user.update).mockResolvedValue(updatedUser)

    const result = await updateUserById({ id: 'user-1', referredBy: 'referrer-1' })

    expect(result).toEqual(updatedUser)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ referredBy: 'referrer-1' }),
    })
  })
})
