import { ApiError } from '@play-money/api-helpers/client'

export type ActionableError = {
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

const ERROR_CODE_MAP: Record<string, (message: string) => ActionableError> = {
  INSUFFICIENT_BALANCE: (message) => ({
    title: 'Insufficient balance',
    description: message,
    action: {
      label: 'Claim daily bonus',
      href: '/questions',
    },
  }),
  INSUFFICIENT_SHARES: (message) => ({
    title: 'Insufficient shares',
    description: message,
  }),
  MARKET_CLOSED: (message) => ({
    title: 'Market closed',
    description: message,
    action: {
      label: 'Browse open markets',
      href: '/questions',
    },
  }),
  MARKET_RESOLVED: (message) => ({
    title: 'Market resolved',
    description: message || 'This market has already been resolved.',
    action: {
      label: 'Browse open markets',
      href: '/questions',
    },
  }),
  MARKET_CANCELED: (message) => ({
    title: 'Market canceled',
    description: message || 'This market has been canceled.',
    action: {
      label: 'Browse open markets',
      href: '/questions',
    },
  }),
}

const STATUS_CODE_MAP: Record<number, (message: string) => ActionableError> = {
  401: (message) => ({
    title: 'Sign in required',
    description: message || 'You need to sign in to perform this action.',
    action: {
      label: 'Sign in',
      href: '/login',
    },
  }),
  403: (message) => ({
    title: 'Access denied',
    description: message || 'You do not have permission to perform this action.',
  }),
  429: () => ({
    title: 'Too many requests',
    description: 'You are making requests too quickly. Please wait a moment and try again.',
  }),
}

export function getActionableError(error: unknown): ActionableError {
  if (error instanceof ApiError) {
    if (error.code && ERROR_CODE_MAP[error.code]) {
      return ERROR_CODE_MAP[error.code](error.message)
    }

    if (STATUS_CODE_MAP[error.statusCode]) {
      return STATUS_CODE_MAP[error.statusCode](error.message)
    }

    return {
      title: 'Something went wrong',
      description: error.message || 'An unexpected error occurred. Please try again.',
    }
  }

  if (error instanceof Error) {
    return {
      title: 'Something went wrong',
      description: error.message || 'An unexpected error occurred. Please try again.',
    }
  }

  return {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  }
}
