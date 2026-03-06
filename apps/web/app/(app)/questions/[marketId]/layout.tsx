import type { Metadata } from 'next'
import { revalidateTag } from 'next/cache'
import { getExtendedMarket } from '@play-money/api-helpers/client'
import { MarketPageLayout } from '@play-money/markets/components/MarketPageLayout'

export async function generateMetadata({ params }: { params: { marketId: string } }): Promise<Metadata> {
  try {
    const { data: market } = await getExtendedMarket({ marketId: params.marketId })

    const topOption = market.options.sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))[0]
    const topProb = topOption?.probability ?? 50
    const description =
      market.options.length === 2
        ? `${market.options[0]?.name ?? 'Yes'}: ${market.options[0]?.probability ?? 50}% · ${market.options[1]?.name ?? 'No'}: ${market.options[1]?.probability ?? 50}%`
        : `Leading: ${topOption?.name ?? ''} at ${topProb}% · ${market.options.length} options`

    const ogImageUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/og/market?marketId=${market.id}`

    return {
      title: market.question,
      description,
      openGraph: {
        title: market.question,
        description,
        type: 'website',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: market.question,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: market.question,
        description,
        images: [ogImageUrl],
      },
    }
  } catch {
    return { title: 'Play Money' }
  }
}

function buildMarketJsonLd(market: Awaited<ReturnType<typeof getExtendedMarket>>['data']) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://playmoney.dev'
  const marketUrl = `${baseUrl}/questions/${market.id}/${market.slug}`

  const probSummary = market.options
    .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
    .map((o) => `${o.name}: ${o.probability ?? 50}%`)
    .join(', ')

  const answerText = market.resolvedAt
    ? `Resolved. Final probabilities — ${probSummary}. Based on ${market.options.reduce((acc, o) => acc + (o.probability ?? 0), 0)} Play Money prediction market.`
    : `Current prediction on Play Money — ${probSummary}.`

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: market.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answerText,
        },
      },
    ],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Play Money', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: `${baseUrl}/questions` },
      { '@type': 'ListItem', position: 3, name: market.question, item: marketUrl },
    ],
  }

  return [faqSchema, breadcrumbSchema]
}

export default async function AppQuestionsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { marketId: string }
}) {
  const { data: market } = await getExtendedMarket({ marketId: params.marketId })

  // eslint-disable-next-line @typescript-eslint/require-await -- Next requires this to be async since its SSR
  const handleRevalidate = async () => {
    'use server'
    revalidateTag(`market:${params.marketId}`)
  }

  const jsonLdSchemas = buildMarketJsonLd(market)

  return (
    <MarketPageLayout market={market} onRevalidate={handleRevalidate}>
      {jsonLdSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      {children}
    </MarketPageLayout>
  )
}
