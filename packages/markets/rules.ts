import { User, Market } from '@play-money/database'
import { isAdmin } from '@play-money/users/rules'

export function canViewMarket({ market, user }: { market: Market; user: User }): boolean {
  if (market.visibility !== 'PRIVATE') return true
  return market.createdBy === user.id || isAdmin({ user })
}

export function canModifyMarket({ market, user }: { market: Market; user: User }) {
  if (isMarketResolved({ market })) {
    return false
  }
  if (isMarketCanceled({ market })) {
    return false
  }
  return market.createdBy === user.id || isAdmin({ user })
}

export function isConditionalMarket({ market }: { market: Market }): boolean {
  return Boolean((market as Market & { parentMarketId?: string | null }).parentMarketId)
}

export function isConditionalMarketActivated({ market }: { market: Market }): boolean {
  return Boolean((market as Market & { activatedAt?: Date | null }).activatedAt)
}

export function isMarketTradable({ market }: { market: Market }): boolean {
  if (isMarketResolved({ market })) {
    return false
  }
  // Conditional markets are only tradeable after the parent condition is met
  if (isConditionalMarket({ market }) && !isConditionalMarketActivated({ market })) {
    return false
  }
  const now = new Date()
  return !market.closeDate || new Date(market.closeDate) > now
}

export function isMarketClosed({ market }: { market: Market }): boolean {
  return !isMarketTradable({ market }) && !isMarketResolved({ market }) && !isMarketCanceled({ market })
}

export function isMarketResolved({ market }: { market: Market }): boolean {
  return Boolean(market.resolvedAt)
}

export function isMarketCanceled({ market }: { market: Market }): boolean {
  return Boolean(market.canceledAt)
}
