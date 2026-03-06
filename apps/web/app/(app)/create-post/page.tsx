import { addMonths, endOfMonth, isPast } from 'date-fns'
import { revalidateTag } from 'next/cache'
import { getExtendedMarket } from '@play-money/api-helpers/client'
import { CreateMarketForm } from '@play-money/markets/components/CreateMarketForm'

export default async function CreatePost({
  searchParams,
}: {
  searchParams: { question?: string; tags?: string; duplicateFrom?: string }
}) {
  // eslint-disable-next-line @typescript-eslint/require-await -- Await is required by next
  const handleRevalidate = async () => {
    'use server'
    revalidateTag('markets')
  }

  if (searchParams.duplicateFrom) {
    try {
      const { data: sourceMarket } = await getExtendedMarket({ marketId: searchParams.duplicateFrom })

      const optionCount = sourceMarket.options.length
      const type = optionCount <= 2 ? ('binary' as const) : ('multi' as const)

      // If the source market's close date is in the past, default to 1 month from now
      let closeDate: Date | null = null
      if (sourceMarket.closeDate) {
        const sourceDateParsed = new Date(sourceMarket.closeDate)
        closeDate = isPast(sourceDateParsed) ? endOfMonth(addMonths(new Date(), 1)) : sourceDateParsed
      }

      const initialValues = {
        question: sourceMarket.question,
        description: sourceMarket.description ?? '',
        resolutionCriteria: sourceMarket.resolutionCriteria ?? null,
        tags: sourceMarket.tags ?? [],
        closeDate,
        options: sourceMarket.options.map((o) => ({ name: o.name, color: o.color })),
        type,
        visibility: 'PUBLIC' as const,
      }

      return <CreateMarketForm onSuccess={handleRevalidate} initialValues={initialValues} />
    } catch {
      // If market fetch fails, fall through to normal create form
    }
  }

  return (
    <CreateMarketForm
      onSuccess={handleRevalidate}
      initialQuestion={searchParams.question}
      initialTags={searchParams.tags ? searchParams.tags.split(',') : undefined}
    />
  )
}
