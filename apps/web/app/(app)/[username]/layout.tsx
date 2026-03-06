import type { Metadata } from 'next'
import { getUserUsername } from '@play-money/api-helpers/client'
import { UserProfileLayout } from '@play-money/users/components/UserProfileLayout'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  try {
    const { data: user } = await getUserUsername({ username: params.username })
    const title = `${user.displayName} (@${user.username}) — Play Money`
    const description = user.bio
      ? user.bio.slice(0, 160)
      : `View ${user.displayName}'s prediction market profile, positions, and trading history on Play Money.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        ...(user.avatarUrl ? { images: [{ url: user.avatarUrl, width: 200, height: 200, alt: user.displayName }] } : {}),
      },
      twitter: {
        card: 'summary',
        title,
        description,
        ...(user.avatarUrl ? { images: [user.avatarUrl] } : {}),
      },
    }
  } catch {
    return { title: 'Play Money' }
  }
}

export default UserProfileLayout
