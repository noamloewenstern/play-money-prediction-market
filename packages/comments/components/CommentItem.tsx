'use client'

import { formatDistance } from 'date-fns'
import { Ellipsis, History, Pin, Reply } from 'lucide-react'
import React, { useState } from 'react'
import { CommentEditHistoryEntry, getCommentHistory } from '@play-money/api-helpers/client'
import { CommentWithReactions } from '@play-money/comments/lib/getComment'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@play-money/ui/alert-dialog'
import { Button } from '@play-money/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@play-money/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@play-money/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@play-money/ui/dropdown-menu'
import { Editor } from '@play-money/ui/editor'
import { EmojiPicker, EmojiReactionList } from '@play-money/ui/emoji'
import { toast } from '@play-money/ui/use-toast'
import { cn } from '@play-money/ui/utils'
import { UserLink } from '@play-money/users/components/UserLink'
import { formatDistanceToNowShort } from '../../ui/src/helpers'
import { CommentPollDisplay } from './CommentPollDisplay'
import { CreateCommentForm } from './CreateCommentForm'

export function CommentItem({
  activeUserId,
  comment,
  isHighlighted,
  isPending,
  condensed = false,
  canPin = false,
  onEmojiSelect,
  onCreateReply,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onVotePoll,
}: {
  activeUserId: string
  comment: CommentWithReactions
  isHighlighted?: boolean
  isPending?: boolean
  condensed?: boolean
  canPin?: boolean
  onEmojiSelect: (emoji: string) => void
  onCreateReply: (content: string) => Promise<void>
  onEdit: (content: string) => Promise<void>
  onDelete: () => void
  onPin?: () => void
  onUnpin?: () => void
  onVotePoll?: (pollId: string, optionId: string) => void
}) {
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isPortalOpen, setIsPortalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [editHistory, setEditHistory] = useState<Array<CommentEditHistoryEntry> | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const handleCreateReply = async (content: string) => {
    await onCreateReply(content)
    setIsReplyOpen(false)
  }

  const handleCancelReply = () => {
    setIsReplyOpen(false)
  }

  const handleEdit = async (content: string) => {
    await onEdit(content)
    setIsEditing(false)
  }

  const handleViewHistory = async () => {
    setIsHistoryOpen(true)
    if (!editHistory) {
      setIsLoadingHistory(true)
      try {
        const result = await getCommentHistory({ commentId: comment.id })
        setEditHistory(result.data)
      } catch {
        toast({ title: 'Failed to load edit history', variant: 'destructive' })
      } finally {
        setIsLoadingHistory(false)
      }
    }
  }

  const handleCopyLink = () => {
    const currentUrl = window.location.href
    const urlWithCommentId = `${currentUrl}#${comment.id}`
    navigator.clipboard
      .writeText(urlWithCommentId)
      .then(() => {
        toast({ title: 'Link copied to clipboard!' })
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err)
      })
  }

  return (
    <div
      id={comment.id}
      className={cn(
        isHighlighted && 'bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background',
        'group flex flex-row gap-3 rounded-lg px-5 py-3 transition-colors hover:bg-muted/40',
        (isReplyOpen || isPortalOpen) && 'bg-muted/40',
        condensed && 'gap-2 px-3 py-2',
        isPending && 'opacity-60'
      )}
    >
      <UserAvatar user={comment.author} className="mt-2" />

      <Collapsible open={isReplyOpen} onOpenChange={setIsReplyOpen} className="w-full">
        <div className="flex flex-row items-center gap-2">
          <UserLink user={comment.author} className="truncate" hideUsername />

          <div className="flex-shrink-0 text-sm text-muted-foreground">
            {formatDistanceToNowShort(comment.createdAt)}
          </div>

          {comment.pinnedAt ? (
            <div className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-primary">
              <Pin className="h-3 w-3" />
              Pinned
            </div>
          ) : null}

          {comment.edited && <div className="flex-shrink-0 text-sm text-muted-foreground">(edited)</div>}

          <div
            className={cn(
              '-my-2 -mr-2 ml-auto flex flex-row items-center transition-opacity group-hover:opacity-100',
              (isReplyOpen || isPortalOpen) && 'opacity-100',
              'opacity-100 md:opacity-0'
            )}
          >
            <EmojiPicker buttonProps={{ variant: 'ghost' }} onSelect={onEmojiSelect} onOpenChange={setIsPortalOpen} />

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <Reply className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>

            <DropdownMenu onOpenChange={setIsPortalOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onCloseAutoFocus={(e) => {
                  // Dont focus DropdownMenuTrigger on close, messes with edit editor auto-focus
                  e.preventDefault()
                }}
              >
                <DropdownMenuItem onClick={handleCopyLink}>Copy Link</DropdownMenuItem>

                {comment.edited ? (
                  <DropdownMenuItem onClick={handleViewHistory}>
                    <History className="mr-2 h-4 w-4" />
                    View Edit History
                  </DropdownMenuItem>
                ) : null}

                {canPin && !comment.parentId ? (
                  <>
                    <DropdownMenuSeparator />
                    {comment.pinnedAt ? (
                      <DropdownMenuItem onClick={onUnpin}>Unpin</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={onPin}>Pin to top</DropdownMenuItem>
                    )}
                  </>
                ) : null}

                {activeUserId === comment.author.id ? (
                  <>
                    <DropdownMenuItem
                      onSelect={() => {
                        setIsEditing(true)
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete your comment.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={onDelete}>
                              Continue
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div>
          {isEditing ? (
            <div className="my-2">
              <CreateCommentForm
                initialContent={comment.content}
                variant="edit"
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                focusOnRender
              />
            </div>
          ) : (
            <Editor className="min-h-6" inputClassName="text-sm md:text-base" value={comment.content} disabled />
          )}

          {comment.poll && !isEditing ? (
            <CommentPollDisplay
              poll={comment.poll}
              activeUserId={activeUserId}
              onVote={onVotePoll}
              isPending={isPending}
            />
          ) : null}
        </div>

        <EmojiReactionList
          activeUserId={activeUserId}
          reactions={comment.reactions}
          pickerClassName={cn(
            'opacity-0 transition-opacity group-hover:opacity-100',
            (isReplyOpen || isPortalOpen) && 'opacity-100'
          )}
          onSelect={onEmojiSelect}
          onOpenChange={setIsPortalOpen}
        />

        <CollapsibleContent>
          <div className="mt-2">
            <CreateCommentForm
              variant="reply"
              onSubmit={handleCreateReply}
              onCancel={handleCancelReply}
              focusOnRender
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="comment-edit-history-dialog">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
          </DialogHeader>

          {isLoadingHistory ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading history...</div>
          ) : editHistory && editHistory.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No edit history available.</div>
          ) : (
            <div className="space-y-4">
              {editHistory?.map((entry, index) => (
                <div key={entry.id} className="rounded-lg border p-4 space-y-2" data-testid="comment-edit-history-entry">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {index === 0 ? 'Previous version' : `Version ${editHistory.length - index}`}
                    </span>
                    <span>·</span>
                    <span>{formatDistanceToNowShort(new Date(entry.editedAt))} ago</span>
                    <span>·</span>
                    <span>edited by {entry.editedBy.displayName}</span>
                  </div>
                  <Editor className="min-h-6" inputClassName="text-sm" value={entry.content} disabled />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
