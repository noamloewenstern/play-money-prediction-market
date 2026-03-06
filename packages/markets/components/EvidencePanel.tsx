'use client'

import { ScaleIcon } from 'lucide-react'
import React from 'react'
import { useMarketEvidence } from '@play-money/api-helpers/client/hooks'
import { useUser } from '@play-money/users/context/UserContext'
import { EvidenceForm } from './EvidenceForm'
import { EvidenceItem } from './EvidenceItem'

export function EvidencePanel({ marketId }: { marketId: string }) {
  const { user } = useUser()
  const { data, mutate } = useMarketEvidence({ marketId })
  const evidenceList = data?.data ?? []

  const handleChange = () => {
    void mutate()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ScaleIcon className="size-4" />
          <span>Evidence &amp; Arguments</span>
          {evidenceList.length > 0 ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{evidenceList.length}</span>
          ) : null}
        </div>
        {user ? <EvidenceForm marketId={marketId} onSuccess={handleChange} /> : null}
      </div>

      {evidenceList.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No evidence submitted yet. Be the first to add context for resolvers.
        </p>
      ) : (
        <div className="divide-y">
          {evidenceList.map((evidence) => (
            <EvidenceItem
              key={evidence.id}
              evidence={evidence}
              marketId={marketId}
              canDelete={user?.id === evidence.authorId || user?.role === 'ADMIN'}
              onDelete={handleChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
