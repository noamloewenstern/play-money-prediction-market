import { redirect } from 'next/navigation'
import { getExtendedMarket } from '@play-money/api-helpers/client'

export default async function AppPostsMarketIdPage({ params }: { params: { marketId: string } }) {
  const { data: market } = await getExtendedMarket({ marketId: params.marketId })
  redirect(`/questions/${market.id}/${market.slug || 'market'}`)
}
