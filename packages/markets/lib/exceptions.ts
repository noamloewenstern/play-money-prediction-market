export class MarketNotFoundError extends Error {
  static code = 'MARKET_NOT_FOUND'

  constructor(message = 'Market not found') {
    super(message)
    this.name = 'MarketNotFoundError'
  }
}

export class MarketClosedError extends Error {
  static code = 'MARKET_CLOSED'

  constructor(message = 'Market is closed') {
    super(message)
    this.name = 'MarketClosedError'
  }
}

export class MarketResolvedError extends Error {
  static code = 'MARKET_RESOLVED'

  constructor(message = 'Market already resolved') {
    super(message)
    this.name = 'MarketResolvedError'
  }
}

export class MarketCanceledError extends Error {
  static code = 'MARKET_CANCELED'

  constructor(message = 'Market is canceled') {
    super(message)
    this.name = 'MarketCanceledError'
  }
}

export class MarketOptionNotFoundError extends Error {
  static code = 'MARKET_OPTION_NOT_FOUND'

  constructor(message = 'Market option not found') {
    super(message)
    this.name = 'MarketOptionNotFoundError'
  }
}

export class MarketAccountNotFoundError extends Error {
  static code = 'MARKET_ACCOUNT_NOT_FOUND'

  constructor(message = 'Market account not found') {
    super(message)
    this.name = 'MarketAccountNotFoundError'
  }
}

export class InsufficientBalanceError extends Error {
  static code = 'INSUFFICIENT_BALANCE'

  constructor(message = 'Insufficient balance') {
    super(message)
    this.name = 'InsufficientBalanceError'
  }
}

export class InvalidTransactionTypeError extends Error {
  static code = 'INVALID_TRANSACTION_TYPE'

  constructor(message = 'Invalid transaction type') {
    super(message)
    this.name = 'InvalidTransactionTypeError'
  }
}
