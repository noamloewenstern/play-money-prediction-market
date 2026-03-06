'use client'

import React, { useState, useEffect } from 'react'
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
  const nestedComments = flattenReplies(comments)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  const [prefillContent, setPrefillContent] = useState<string | undefined>(undefined)
  const hasComments = nestedComments.length > 0

  useEffect(function highlightCommentFromURL() {
    const url = new URL(window.location.href)
    const possibleCommentId = url.hash.substring(1)

    // Check if the comment exists in the list
    if (possibleCommentId && comments.find(({ id }) => id === possibleCommentId)) {
      setHighlightedCommentId(possibleCommentId)

      const element = document.getElementById(possibleCommentId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [])

  const handleToggleEmojiReaction = (commentId: string) => async (emoji: string) => {
    try {
      await createCommentReaction({ commentId, emoji })
    } catch (error) {
      if (error instanceof Error && error.message !== 'deleted') {
        throw error
      }
    }
    onRevalidate()
  }

  const handleCreateReply = (parentId?: string) => async (content: string) => {
    try {
      await createComment({ content, parentId, entity })
      onRevalidate()
    } catch (error) {
      toast({
        title: 'There was an error creating your comment',
        description: (error as Error).message,
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

  const handlePin = (commentId: string) => async () => {
    try {
      await pinComment({ commentId })
      onRevalidate()
    } catch (error) {
      toast({
        title: 'Could not pin comment',
        description: (error as Error).message,
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
        description: (error as Error).message,
      })
    }
  }

  const userCanPin = Boolean(user && (user.role === 'ADMIN' || (entityCreatorId && user.id === entityCreatorId)))

  return (
    <div>
      <div className="px-6 py-4">
        <CreateCommentForm key={prefillContent} initialContent={prefillContent} onSubmit={handleCreateReply()} />
      </div>
      {!hasComments && marketQuestion ? (
        <DiscussionStarters marketQuestion={marketQuestion} onStarterClick={setPrefillContent} />
      ) : null}
      {nestedComments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            activeUserId={user?.id || ''}
            comment={comment}
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
