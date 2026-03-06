const DEFAULT_BRACKET_COUNT = 5

const BRACKET_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EF4444', // red
  '#6366F1', // indigo
  '#14B8A6', // teal
]

function formatValue(value: number, unit: string): string {
  const absValue = Math.abs(value)
  let formatted: string
  if (absValue >= 1_000_000_000) {
    formatted = `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  } else if (absValue >= 1_000_000) {
    formatted = `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  } else if (absValue >= 1_000) {
    formatted = `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  } else {
    formatted = value % 1 === 0 ? String(value) : value.toFixed(2)
  }
  return `${unit}${formatted}`
}

export type NumericBracket = {
  name: string
  color: string
  lowerBound: number
  upperBound: number
}

/**
 * Generate evenly-spaced bracket options for a numeric range market.
 */
export function generateNumericBrackets({
  numericMin,
  numericMax,
  numericUnit = '',
  numBrackets = DEFAULT_BRACKET_COUNT,
}: {
  numericMin: number
  numericMax: number
  numericUnit?: string
  numBrackets?: number
}): Array<NumericBracket> {
  const step = (numericMax - numericMin) / numBrackets
  const brackets: Array<NumericBracket> = []

  for (let i = 0; i < numBrackets; i++) {
    const lower = numericMin + i * step
    const upper = numericMin + (i + 1) * step
    const color = BRACKET_COLORS[i % BRACKET_COLORS.length]

    let name: string
    if (numBrackets === 1) {
      name = `${formatValue(lower, numericUnit)} – ${formatValue(upper, numericUnit)}`
    } else if (i === 0) {
      name = `Under ${formatValue(upper, numericUnit)}`
    } else if (i === numBrackets - 1) {
      name = `Over ${formatValue(lower, numericUnit)}`
    } else {
      name = `${formatValue(lower, numericUnit)} – ${formatValue(upper, numericUnit)}`
    }

    brackets.push({ name, color, lowerBound: lower, upperBound: upper })
  }

  return brackets
}

/**
 * Given a numeric resolution value, determine which bracket (by option index)
 * the value falls into, then return the corresponding option id.
 *
 * Options must be sorted by createdAt (ascending) to match bracket order.
 */
export function getNumericBracketOptionId({
  options,
  numericMin,
  numericMax,
  value,
}: {
  options: Array<{ id: string }>
  numericMin: number
  numericMax: number
  value: number
}): string {
  const n = options.length
  const step = (numericMax - numericMin) / n

  // Clamp value within range
  const clamped = Math.max(numericMin, Math.min(numericMax, value))
  const index = Math.min(Math.floor((clamped - numericMin) / step), n - 1)

  return options[index].id
}
