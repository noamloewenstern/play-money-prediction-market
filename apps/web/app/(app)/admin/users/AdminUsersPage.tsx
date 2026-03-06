'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import useSWR from 'swr'
import { getAdminUsers, updateAdminUser } from '@play-money/api-helpers/client'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@play-money/ui/dialog'
import { Input } from '@play-money/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@play-money/ui/table'
import { toast } from '@play-money/ui/use-toast'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<{
    id: string
    username: string
    displayName: string
    role: string
    suspendedAt: string | null
  } | null>(null)
  const [grantAmount, setGrantAmount] = useState('')
  const [suspendReason, setSuspendReason] = useState('')
  const [dialogMode, setDialogMode] = useState<'role' | 'grant' | 'suspend' | null>(null)

  const { data, mutate, isLoading } = useSWR(['admin-users', search, page], () =>
    getAdminUsers({ search: search || undefined, page, limit: 50 })
  )

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await updateAdminUser({ userId, body: { role: newRole } })
      toast({ title: `User role updated to ${newRole}` })
      void mutate()
      setDialogMode(null)
    } catch (_error) {
      toast({ title: 'Failed to update user role', variant: 'destructive' })
    }
  }

  async function handleGrantBonus(userId: string) {
    const amount = parseFloat(grantAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' })
      return
    }
    try {
      await updateAdminUser({ userId, body: { grantAmount: amount } })
      toast({ title: `Granted ${amount} to user` })
      void mutate()
      setDialogMode(null)
      setGrantAmount('')
    } catch (_error) {
      toast({ title: 'Failed to grant bonus', variant: 'destructive' })
    }
  }

  async function handleSuspendToggle() {
    if (!selectedUser) return
    const isSuspending = !selectedUser.suspendedAt
    try {
      await updateAdminUser({
        userId: selectedUser.id,
        body: { suspended: isSuspending, suspendReason: suspendReason || undefined },
      })
      toast({ title: isSuspending ? 'User suspended' : 'User unsuspended' })
      void mutate()
      setDialogMode(null)
      setSuspendReason('')
    } catch (_error) {
      toast({ title: 'Failed to update suspension', variant: 'destructive' })
    }
  }

  const users = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">User Management</h3>
        <p className="text-sm text-muted-foreground">View and manage platform users.</p>
      </div>

      <Input
        className="max-w-sm"
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Search by username, name, or email..."
        value={search}
      />

      {isLoading ? (
        <div className="text-muted-foreground">Loading users...</div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Markets</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center text-muted-foreground" colSpan={8}>
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link className="hover:underline" href={`/admin/users/${u.id}`}>
                          <div className="font-medium">{u.displayName}</div>
                          <div className="text-xs text-muted-foreground">@{u.username}</div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.suspendedAt ? 'destructive' : 'outline'}>
                          {u.suspendedAt ? 'Suspended' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>{u._count.markets}</TableCell>
                      <TableCell>{u._count.transactions}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => {
                              setSelectedUser(u)
                              setDialogMode('role')
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Role
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedUser(u)
                              setDialogMode('grant')
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Grant
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedUser(u)
                              setDialogMode('suspend')
                            }}
                            size="sm"
                            variant={u.suspendedAt ? 'outline' : 'destructive'}
                          >
                            {u.suspendedAt ? 'Unsuspend' : 'Suspend'}
                          </Button>
                        </div>
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
                Page {page} of {totalPages} ({data?.total} total users)
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

      <Dialog
        onOpenChange={(open) => {
          if (!open) setDialogMode(null)
        }}
        open={dialogMode === 'role' && Boolean(selectedUser)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {selectedUser?.displayName}</DialogTitle>
            <DialogDescription>Change the role for @{selectedUser?.username}.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (selectedUser) void handleRoleChange(selectedUser.id, 'USER')
              }}
              variant={selectedUser?.role === 'USER' ? 'default' : 'outline'}
            >
              User
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) void handleRoleChange(selectedUser.id, 'ADMIN')
              }}
              variant={selectedUser?.role === 'ADMIN' ? 'default' : 'outline'}
            >
              Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null)
            setGrantAmount('')
          }
        }}
        open={dialogMode === 'grant' && Boolean(selectedUser)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Bonus to {selectedUser?.displayName}</DialogTitle>
            <DialogDescription>
              Grant play money balance to @{selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              onChange={(e) => { setGrantAmount(e.target.value) }}
              placeholder="Amount..."
              type="number"
              value={grantAmount}
            />
            <Button
              onClick={() => {
                if (selectedUser) void handleGrantBonus(selectedUser.id)
              }}
            >
              Grant Bonus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null)
            setSuspendReason('')
          }
        }}
        open={dialogMode === 'suspend' && Boolean(selectedUser)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.suspendedAt ? 'Unsuspend' : 'Suspend'} {selectedUser?.displayName}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.suspendedAt
                ? `Restore access for @${selectedUser.username}.`
                : `Suspend @${selectedUser?.username} from the platform.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              onChange={(e) => { setSuspendReason(e.target.value) }}
              placeholder="Reason..."
              value={suspendReason}
            />
            <Button
              onClick={() => { void handleSuspendToggle() }}
              variant={selectedUser?.suspendedAt ? 'default' : 'destructive'}
            >
              {selectedUser?.suspendedAt ? 'Unsuspend User' : 'Suspend User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
