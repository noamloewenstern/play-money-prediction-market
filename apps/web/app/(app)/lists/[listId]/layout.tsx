import type { Metadata } from 'next'
import { revalidateTag } from 'next/cache'
import { getExtendedList } from '@play-money/api-helpers/client'
import { ListPageLayout } from '@play-money/lists/components/ListPageLayout'

export async function generateMetadata({ params }: { params: { listId: string } }): Promise<Metadata> {
  try {
    const { data: list } = await getExtendedList({ listId: params.listId })
    const title = `${list.title} — Play Money`
    const description =
      list.description?.slice(0, 160) ??
      `${list.title} — a collection of ${list.markets.length} prediction market${list.markets.length === 1 ? '' : 's'} by ${list.owner.displayName} on Play Money.`

    return {
      title,
      description,
      openGraph: { title, description, type: 'website' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: 'Play Money' }
  }
}

export default async function AppListsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { listId: string }
}) {
  const { data: list } = await getExtendedList({ listId: params.listId })

  // eslint-disable-next-line @typescript-eslint/require-await -- Next requires this to be async since its SSR
  const handleRevalidate = async () => {
    'use server'
    revalidateTag(`market:${params.listId}`)
  }

  return (
    <ListPageLayout list={list} onRevalidate={handleRevalidate}>
      {children}
    </ListPageLayout>
  )
}
