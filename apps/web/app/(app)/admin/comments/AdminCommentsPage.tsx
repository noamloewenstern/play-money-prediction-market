'use client'

import { MessageSquareIcon } from 'lucide-react'
import React, { useState } from 'react'
import useSWR from 'swr'
import { getAdminComments, updateAdminComment } from '@play-money/api-helpers/client'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Input } from '@play-money/ui/input'
import { Skeleton } from '@play-money/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@play-money/ui/table'
import { toast } from '@play-money/ui/use-toast'

export function AdminCommentsPage() {
  const [search, setSearch] = useState('')
  const [showHiddenOnly, setShowHiddenOnly] = useState(false)
  const [page, setPage] = useState(1)

  const { data, mutate, isLoading } = useSWR(['admin-comments', search, showHiddenOnly, page], () =>
    getAdminComments({
      search: search || undefined,
      hidden: showHiddenOnly || undefined,
      page,
      limit: 50,
    })
  )

  async function handleToggleHidden(commentId: string, currentHidden: boolean) {
    try {
      await updateAdminComment({ commentId, body: { hidden: !currentHidden } })
      toast({ title: currentHidden ? 'Comment unhidden' : 'Comment hidden' })
      void mutate()
    } catch (_error) {
      toast({ title: 'Failed to update comment', variant: 'destructive' })
    }
  }

  const comments = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Comment Moderation</h3>
        <p className="text-sm text-muted-foreground">Review and moderate platform comments.</p>
      </div>

      <div className="flex gap-2">
        <Input
          className="max-w-sm"
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search comments..."
          value={search}
        />
        <Button
          onClick={() => {
            setShowHiddenOnly(!showHiddenOnly)
            setPage(1)
          }}
          variant={showHiddenOnly ? 'default' : 'outline'}
        >
          {showHiddenOnly ? 'Showing Hidden' : 'Show Hidden Only'}
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead className="min-w-[300px]">Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-14 rounded-md" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead className="min-w-[300px]">Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-32" colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                          <MessageSquareIcon className="size-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No comments found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="text-sm font-medium">@{comment.author.username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate text-sm">
                          {comment.content.length > 100
                            ? `${comment.content.substring(0, 100)}...`
                            : comment.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{comment.entityType}</Badge>
                      </TableCell>
                      <TableCell>
                        {comment.hidden ? (
                          <Badge variant="destructive">Hidden</Badge>
                        ) : (
                          <Badge variant="default">Visible</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => { void handleToggleHidden(comment.id, comment.hidden) }}
                          size="sm"
                          variant={comment.hidden ? 'outline' : 'destructive'}
                        >
                          {comment.hidden ? 'Unhide' : 'Hide'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({data?.total} total comments)
              </div>
              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => { setPage(page - 1) }} size="sm" variant="outline">
                  Previous
                </Button>
                <Button disabled={page >= totalPages} onClick={() => { setPage(page + 1) }} size="sm" variant="outline">
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
