import { revalidateTag } from 'next/cache'
import React from 'react'
import { getListComments } from '@play-money/api-helpers/client'
import { CommentsList } from '@play-money/comments/components/CommentsList'

export async function ListComments({ listId, creatorId }: { listId: string; creatorId?: string }) {
  const { data: comments } = await getListComments({ listId })

  const handleRevalidate = async () => {
    'use server'
    revalidateTag(`list:${listId}:comments`)
  }

  return (
    <CommentsList
      comments={comments}
      entity={{ type: 'LIST', id: listId }}
      entityCreatorId={creatorId}
      onRevalidate={handleRevalidate}
    />
  )
}
