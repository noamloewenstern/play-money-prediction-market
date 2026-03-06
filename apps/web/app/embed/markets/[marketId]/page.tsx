import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getExtendedMarket } from '@play-money/api-helpers/client'
import { Progress } from '@play-money/ui/progress'
import { EmbedMarketChart } from './EmbedMarketChart'

export const dynamic = 'force-dynamic'

type GraphDataPoint = {
  startAt: string
  endAt: string
  options: Array<{
    id: string
    probability: number
  }>
}

function formatProbability(probability: number | null) {
  if (probability === null) return ''
  const rounded = Math.round(probability)
  if (rounded === 0) return '<1%'
  if (rounded === 100) return '>99%'
  return `${rounded}%`
}

async function getMarketGraph(marketId: string): Promise<Array<GraphDataPoint>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/markets/${marketId}/graph`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data: Array<GraphDataPoint> }
    return json.data ?? []
  } catch {
    return []
  }
}

export default async function EmbedMarketPage({ params }: { params: { marketId: string } }) {
  let market
  try {
    const result = await getExtendedMarket({ marketId: params.marketId })
    market = result.data
  } catch {
    notFound()
  }

  if (!market) notFound()

  const graphData = await getMarketGraph(params.marketId)

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? ''
  const marketUrl = `${webUrl}/questions/${market.id}/${market.slug}`

  const sortedOptions = [...market.options].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const isBinary = sortedOptions.length <= 2
  const primaryOption = sortedOptions[0]

  return (
    <div className="flex min-h-screen items-start justify-center bg-transparent p-0">
      <div className="w-full overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* Header */}
        <div className="px-4 pb-2 pt-4">
          <Link
            className="group block text-sm font-semibold leading-snug text-foreground hover:text-primary"
            href={marketUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {market.question}
            <ExternalLinkIcon className="ml-1 inline-block size-3 opacity-0 transition-opacity group-hover:opacity-60" />
          </Link>
        </div>

        {/* Probability display */}
        <div className="px-4 py-2">
          {isBinary && primaryOption ? (
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-bold tabular-nums leading-none"
                style={{ color: primaryOption.color ?? undefined }}
              >
                {formatProbability(primaryOption.probability)}
              </span>
              <Progress
                className="h-2 flex-1 rounded-full"
                indicatorStyle={{ backgroundColor: primaryOption.color ?? undefined }}
                value={primaryOption.probability ?? 0}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              {sortedOptions.slice(0, 4).map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <span
                    className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums"
                    style={{ color: option.color ?? undefined }}
                  >
                    {formatProbability(option.probability)}
                  </span>
                  <Progress
                    className="h-1.5 flex-1 rounded-full"
                    indicatorStyle={{ backgroundColor: option.color ?? undefined }}
                    value={option.probability ?? 0}
                  />
                  <span className="w-24 truncate text-xs text-muted-foreground">{option.name}</span>
                </div>
              ))}
              {sortedOptions.length > 4 && (
                <p className="text-right text-xs text-muted-foreground">+{sortedOptions.length - 4} more</p>
              )}
            </div>
          )}
        </div>

        {/* Mini chart */}
        {graphData.length > 1 && (
          <div className="px-2">
            <EmbedMarketChart
              data={graphData}
              options={sortedOptions.map((o) => ({ id: o.id, name: o.name, color: o.color }))}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">Prediction market</span>
          <Link
            className="text-xs font-medium text-primary hover:underline"
            href={marketUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Play Money →
          </Link>
        </div>
      </div>
    </div>
  )
}
