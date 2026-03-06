const STORAGE_KEY = 'play-money:skip-trade-confirmation'

export function getSkipTradeConfirmation(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setSkipTradeConfirmation(skip: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, String(skip))
}
