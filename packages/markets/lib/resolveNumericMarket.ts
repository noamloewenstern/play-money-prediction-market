import db from '@play-money/database'
import { getMarket } from './getMarket'
import { getNumericBracketOptionId } from './generateNumericBrackets'
import { resolveMarket } from './resolveMarket'

/**
 * Resolve a numeric range market by providing the actual outcome value.
 * The system finds which bracket the value falls into and resolves to that option.
 */
export async function resolveNumericMarket({
  resolverId,
  marketId,
  numericValue,
  supportingLink,
}: {
  resolverId: string
  marketId: string
  numericValue: number
  supportingLink?: string
}) {
  const market = await getMarket({ id: marketId, extended: true })

  if (market.numericMin == null || market.numericMax == null) {
    throw new Error('Market is not a numeric range market')
  }

  // Options sorted by createdAt to match bracket generation order
  const sortedOptions = [...market.options].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const winningOptionId = getNumericBracketOptionId({
    options: sortedOptions,
    numericMin: market.numericMin,
    numericMax: market.numericMax,
    value: numericValue,
  })

  // Store the actual numeric resolution value on the market
  await db.market.update({
    where: { id: marketId },
    data: { numericResolution: numericValue },
  })

  // Run normal resolution with the winning bracket's option id
  await resolveMarket({
    resolverId,
    marketId,
    optionId: winningOptionId,
    supportingLink,
  })
}
