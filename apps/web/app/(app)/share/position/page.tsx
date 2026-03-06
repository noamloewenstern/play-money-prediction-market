import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Decimal from 'decimal.js'
import db from '@play-money/database'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: { marketId?: string; optionId?: string; userId?: string }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { marketId, optionId, userId } = searchParams

  if (!marketId || !optionId || !userId) {
    return { title: 'Play Money' }
  }

  const [market, option, user, position] = await Promise.all([
    db.market.findUnique({ where: { id: marketId } }),
    db.marketOption.findUnique({ where: { id: optionId } }),
    db.user.findUnique({ where: { id: userId } }),
    db.marketOptionPosition.findFirst({
      where: {
        marketId,
        optionId,
        account: { userPrimary: { id: userId } },
      },
    }),
  ])

  if (!market || !option || !user) {
    return { title: 'Play Money' }
  }

  const currentProb = option.probability ?? 50
  const cost = position ? new Decimal(position.cost).toNumber() : 0
  const value = position ? new Decimal(position.value).toNumber() : 0
  const pnlPct = cost > 0 ? Math.round(((value - cost) / cost) * 100) : 0
  const pnlLabel = pnlPct >= 0 ? `+${pnlPct}%` : `${pnlPct}%`

  const title = `${user.displayName} holds ${option.name} at ${currentProb}% (${pnlLabel}) — ${market.question}`
  const description = `${user.displayName} predicted "${option.name}" on Play Money. See their position and make your own prediction.`

  const ogImageUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/og/position?marketId=${marketId}&optionId=${optionId}&userId=${userId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${user.displayName}'s position in ${market.question}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function SharePositionPage({ searchParams }: Props) {
  const { marketId } = searchParams

  if (!marketId) {
    redirect('/')
  }

  redirect(`/questions/${marketId}`)
}
