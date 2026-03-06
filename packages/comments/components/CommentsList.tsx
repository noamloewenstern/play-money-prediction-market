'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  createComment,
  createCommentReaction,
  deleteComment,
  pinComment,
  unpinComment,
  updateComment,
} from '@play-money/api-helpers/client'
import { CommentWithReactions } from '@play-money/comments/lib/getComment'
import { CommentEntityType } from '@play-money/database'
import { toast } from '@play-money/ui/use-toast'
import { useUser } from '@play-money/users/context/UserContext'
import { flattenReplies } from '../lib/flattenReplies'
import { CommentItem } from './CommentItem'
import { CreateCommentForm } from './CreateCommentForm'
import { DiscussionStarters } from './DiscussionStarters'

type OptimisticComment = CommentWithReactions & { _isPending?: boolean }

export function CommentsList({
  comments,
  entity,
  entityCreatorId,
  marketQuestion,
  onRevalidate,
}: {
  comments: Array<CommentWithReactions>
  entity: { type: CommentEntityType; id: string }
  entityCreatorId?: string
  marketQuestion?: string
  onRevalidate: () => void
}) {
  const { user } = useUser()
  const [optimisticComments, setOptimisticComments] = useState<Array<OptimisticComment>>([])
  const [optimisticReactions, setOptimisticReactions] = useState<
    Map<string, Array<{ emoji: string; userId: string; displayName: string }>>
  >(new Map())
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  const [prefillContent, setPrefillContent] = useState<string | undefined>(undefined)
  const optimisticIdCounter = useRef(0)

  const allComments = mergeComments(comments, optimisticComments, optimisticReactions, user?.id)
  const nestedComments = flattenReplies(allComments)
  const hasComments = nestedComments.length > 0

  useEffect(function highlightCommentFromURL() {
    const url = new URL(window.location.href)
    const possibleCommentId = url.hash.substring(1)

    if (possibleCommentId && comments.find(({ id }) => id === possibleCommentId)) {
      setHighlightedCommentId(possibleCommentId)

      const element = document.getElementById(possibleCommentId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [])

  // Clear optimistic state when server data updates
  useEffect(
    function clearOptimisticOnServerUpdate() {
      setOptimisticComments([])
      setOptimisticReactions(new Map())
    },
    [comments]
  )

  const handleToggleEmojiReaction = useCallback(
    (commentId: string) => async (emoji: string) => {
      if (!user) return

      // Optimistically update reactions
      setOptimisticReactions((prev) => {
        const next = new Map(prev)
        const existing = next.get(commentId) || []
        const hasReaction = existing.some((r) => r.emoji === emoji && r.userId === user.id)

        if (hasReaction) {
          // Remove the reaction optimistically
          next.set(
            commentId,
            existing.filter((r) => !(r.emoji === emoji && r.userId === user.id))
          )
        } else {
          // Add the reaction optimistically
          next.set(commentId, [...existing, { emoji, userId: user.id, displayName: user.displayName }])
        }
        return next
      })

      try {
        await createCommentReaction({ commentId, emoji })
        onRevalidate()
      } catch (error) {
        // Revert optimistic update
        setOptimisticReactions((prev) => {
          const next = new Map(prev)
          next.delete(commentId)
          return next
        })
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

  const handleCreateReply = useCallback(
    (parentId?: string) => async (content: string) => {
      if (!user) return

      const tempId = `optimistic-${Date.now()}-${optimisticIdCounter.current++}`
      const optimisticComment: OptimisticComment = {
        id: tempId,
        content,
        createdAt: new Date(),
        updatedAt: null,
        edited: false,
        authorId: user.id,
        author: user,
        parentId: parentId ?? null,
        hidden: false,
        pinnedAt: null,
        entityType: entity.type,
        entityId: entity.id,
        reactions: [],
        _isPending: true,
      }

      setOptimisticComments((prev) => [...prev, optimisticComment])

      // Fire-and-forget: don't await so the form resets immediately
      void createComment({ content, parentId, entity })
        .then(() => {
          onRevalidate()
        })
        .catch((error: unknown) => {
          setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId))
          toast({
            title: 'Failed to post comment',
            description: (error as Error).message || 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
          })
        })
    },
    [user, entity, onRevalidate]
  )

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

  const handlePin = (commentId: string) => async () => {
    try {
      await pinComment({ commentId })
      onRevalidate()
    } catch (error) {
      toast({
        title: 'Could not pin comment',
        description: (error as Error).message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUnpin = (commentId: string) => async () => {
    try {
      await unpinComment({ commentId })
      onRevalidate()
    } catch (error) {
      toast({
        title: 'Could not unpin comment',
        description: (error as Error).message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const userCanPin = Boolean(user && (user.role === 'ADMIN' || (entityCreatorId && user.id === entityCreatorId)))

  return (
    <div>
      <div className="px-6 py-4">
        <CreateCommentForm
          key={prefillContent}
          initialContent={prefillContent}
          draftKey={`comment-draft-${entity.type}-${entity.id}`}
          onSubmit={handleCreateReply()}
        />
      </div>
      {!hasComments && marketQuestion ? (
        <DiscussionStarters marketQuestion={marketQuestion} onStarterClick={setPrefillContent} />
      ) : null}
      {nestedComments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            activeUserId={user?.id || ''}
            comment={comment}
            isPending={(comment as OptimisticComment)._isPending}
            isHighlighted={highlightedCommentId === comment.id}
            canPin={userCanPin}
            onEmojiSelect={handleToggleEmojiReaction(comment.id)}
            onCreateReply={handleCreateReply(comment.id)}
            onEdit={handleEdit(comment.id)}
            onDelete={handleDelete(comment.id)}
            onPin={handlePin(comment.id)}
            onUnpin={handleUnpin(comment.id)}
          />
          <div className="ml-6 sm:ml-12">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                activeUserId={user?.id || ''}
                comment={reply}
                isPending={(reply as OptimisticComment)._isPending}
                isHighlighted={highlightedCommentId === reply.id}
                onEmojiSelect={handleToggleEmojiReaction(reply.id)}
                onCreateReply={handleCreateReply(reply.id)}
                onEdit={handleEdit(reply.id)}
                onDelete={handleDelete(reply.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function mergeComments(
  serverComments: Array<CommentWithReactions>,
  optimisticComments: Array<OptimisticComment>,
  optimisticReactions: Map<string, Array<{ emoji: string; userId: string; displayName: string }>>,
  activeUserId?: string
): Array<OptimisticComment> {
  // Apply optimistic reactions to server comments
  const withReactions = serverComments.map((comment) => {
    const pendingReactions = optimisticReactions.get(comment.id)
    if (!pendingReactions || !activeUserId) return comment

    let reactions = [...comment.reactions]

    for (const pending of pendingReactions) {
      const existingIdx = reactions.findIndex((r) => r.emoji === pending.emoji && r.user.id === pending.userId)
      if (existingIdx >= 0) {
        // Reaction already exists in server data - this is a toggle-off, remove it
        reactions = reactions.filter((_, i) => i !== existingIdx)
      } else {
        // Add the optimistic reaction
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
  })

  // Add optimistic comments that don't exist in server data yet
  const merged: Array<OptimisticComment> = [...withReactions]
  for (const opt of optimisticComments) {
    if (!merged.some((c) => c.id === opt.id)) {
      merged.push(opt)
    }
  }

  return merged
}
