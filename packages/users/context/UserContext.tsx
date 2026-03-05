'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { updateMe } from '@play-money/api-helpers/client'
import { User } from '@play-money/database'

const PRISMA_DEFAULT_TIMEZONE = 'America/Los_Angeles'

type UserContextType = {
  user: User | null
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children, user: initialUser }: { children: React.ReactNode; user: User | null }) => {
  const [user, setUser] = useState<User | null>(initialUser)

  useEffect(() => {
    if (!user) return
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (user.timezone === PRISMA_DEFAULT_TIMEZONE && browserTimezone !== PRISMA_DEFAULT_TIMEZONE) {
      updateMe({ timezone: browserTimezone }).then(({ data }) => setUser(data)).catch((error) => { console.error('Failed to update timezone:', error) })
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}
