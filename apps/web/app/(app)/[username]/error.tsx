'use client'

import { useEffect } from 'react'
import { UserNotFoundError } from '@play-money/users/lib/exceptions'

export default function Error({ error }: { error: Error & { digest?: string; code?: string } }) {
  useEffect(() => {
    console.dir(error) // eslint-disable-line -- Log the error to an error reporting service
  }, [error])

  if (error.message === UserNotFoundError.code) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h2 className="text-lg font-semibold">User not found</h2>
        <p className="text-sm text-muted-foreground">This user does not exist or may have been removed.</p>
        <a href="/" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Go home
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">An unexpected error occurred while loading this profile.</p>
      <a href="/" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Go home
      </a>
    </div>
  )
}
