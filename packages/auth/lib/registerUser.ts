import bcrypt from 'bcryptjs'
import db from '@play-money/database'
import { createUser } from '@play-money/users/lib/createUser'
import { UserExistsError } from '@play-money/users/lib/exceptions'

export class WhitelistError extends Error {
  constructor(message = 'Email not allowed') {
    super(message)
    this.name = 'WhitelistError'
  }
}

export async function registerUser({ email, password }: { email: string; password: string }) {
  // Check whitelist
  const whitelist = process.env.AUTH_EMAIL_WHITELIST
  if (whitelist) {
    const allowed = whitelist.split(',').map((e) => e.trim().toLowerCase())
    if (!allowed.includes(email.toLowerCase())) {
      throw new WhitelistError()
    }
  }

  // Create user (handles duplicate check, username gen, signup bonus, referral code)
  const user = await createUser({ email })

  // Set password hash
  const passwordHash = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  return { success: true }
}
