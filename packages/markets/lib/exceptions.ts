export class MarketNotFoundError extends Error {
  constructor(message = 'Market not found') {
    super(message)
    this.name = 'MarketNotFoundError'
  }
}

export class MarketClosedError extends Error {
  constructor(message = 'Market is closed') {
    super(message)
    this.name = 'MarketClosedError'
  }
}

export class MarketOptionNotFoundError extends Error {
  constructor(message = 'Market option not found') {
    super(message)
    this.name = 'MarketOptionNotFoundError'
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message = 'Insufficient balance') {
    super(message)
    this.name = 'InsufficientBalanceError'
  }
}
