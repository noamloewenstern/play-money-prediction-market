'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createComment, createCommentReaction, deleteComment, updateComment } from '@play-money/api-helpers/client'
import { CommentWithReactions } from '@play-money/comments/lib/getComment'
import { CommentEntityType } from '@play-money/database'
import { Card } from '@play-money/ui/card'
import { toast } from '@play-money/ui/use-toast'
import { useUser } from '@play-money/users/context/UserContext'
import { CommentItem } from './CommentItem'

export function CommentItemCard({
  comment: serverComment,
  entity,
  onRevalidate,
}: {
  comment: CommentWithReactions
  entity: { type: CommentEntityType; id: string }
  onRevalidate: () => void
}) {
  const { user } = useUser()
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  const [optimisticReactions, setOptimisticReactions] = useState<
    Array<{ emoji: string; userId: string; displayName: string }>
  >([])

  // Clear optimistic reactions when server data updates
  useEffect(
    function clearOptimisticOnServerUpdate() {
      setOptimisticReactions([])
    },
    [serverComment]
  )

  const comment = applyOptimisticReactions(serverComment, optimisticReactions, user?.id)

  useEffect(function highlightCommentFromURL() {
    const url = new URL(window.location.href)
    const possibleCommentId = url.hash.substring(1)

    if (possibleCommentId && comment.id === possibleCommentId) {
      setHighlightedCommentId(possibleCommentId)

      const element = document.getElementById(possibleCommentId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [])

  const handleToggleEmojiReaction = useCallback(
    (commentId: string) => async (emoji: string) => {
      if (!user) return

      // Optimistically update
      setOptimisticReactions((prev) => {
        const hasReaction = prev.some((r) => r.emoji === emoji && r.userId === user.id)
        if (hasReaction) {
          return prev.filter((r) => !(r.emoji === emoji && r.userId === user.id))
        }
        return [...prev, { emoji, userId: user.id, displayName: user.displayName }]
      })

      try {
        await createCommentReaction({ commentId, emoji })
        onRevalidate()
      } catch (error) {
        setOptimisticReactions([])
        if (error instanceof Error && error.message !== 'deleted') {
          toast({
            title: 'Could not update reaction',
            description: (error as Error).message,
          })
        }
      }
    },
    [user, onRevalidate]
  )

  const handleCreateReply = (parentId?: string) => async (content: string) => {
    try {
      await createComment({ content, parentId, entity })
      onRevalidate()
    } catch (error) {
      toast({
        title: 'Failed to post comment',
        description: (error as Error).message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (commentId: string) => async (content: string) => {
    await updateComment({ commentId, content })
    onRevalidate()
  }

  const handleDelete = (commentId: string) => async () => {
    try {
      await deleteComment({ commentId })
    } catch (error) {
      if (error instanceof Error && error.message !== 'deleted') {
        throw error
      }
    }
    onRevalidate()
  }

  return (
    <Card>
      <CommentItem
        activeUserId={user?.id || ''}
        comment={comment}
        condensed
        isHighlighted={highlightedCommentId === comment.id}
        onEmojiSelect={handleToggleEmojiReaction(comment.id)}
        onCreateReply={handleCreateReply(comment.id)}
        onEdit={handleEdit(comment.id)}
        onDelete={handleDelete(comment.id)}
      />
    </Card>
  )
}

function applyOptimisticReactions(
  comment: CommentWithReactions,
  pendingReactions: Array<{ emoji: string; userId: string; displayName: string }>,
  activeUserId?: string
): CommentWithReactions {
  if (!pendingReactions.length || !activeUserId) return comment

  let reactions = [...comment.reactions]

  for (const pending of pendingReactions) {
    const existingIdx = reactions.findIndex((r) => r.emoji === pending.emoji && r.user.id === pending.userId)
    if (existingIdx >= 0) {
      reactions = reactions.filter((_, i) => i !== existingIdx)
    } else {
      reactions = [
        ...reactions,
        {
          id: `optimistic-reaction-${pending.emoji}-${pending.userId}`,
          emoji: pending.emoji,
          userId: pending.userId,
          commentId: comment.id,
          user: {
            id: pending.userId,
            displayName: pending.displayName,
            username: '',
            avatarUrl: null,
            twitterHandle: null,
            discordHandle: null,
            website: null,
            bio: null,
            timezone: '',
            primaryAccountId: '',
            suspendedAt: null,
            referralCode: null,
            referredBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'USER' as const,
          },
        },
      ]
    }
  }

  return { ...comment, reactions }
}
