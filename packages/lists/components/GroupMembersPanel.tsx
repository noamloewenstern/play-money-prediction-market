'use client'

import { UserPlusIcon, XIcon } from 'lucide-react'
import React, { useState } from 'react'
import { mutate } from 'swr'
import { addGroupMember, removeGroupMember, updateGroupMemberRole } from '@play-money/api-helpers/client'
import { GROUP_MEMBERS_PATH, useGroupMembers } from '@play-money/api-helpers/client/hooks'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Button } from '@play-money/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@play-money/ui/dialog'
import { Input } from '@play-money/ui/input'
import { Label } from '@play-money/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@play-money/ui/select'
import { UserLink } from '@play-money/users/components/UserLink'

type AssignableRole = 'MODERATOR' | 'CONTRIBUTOR' | 'MEMBER'

function RoleBadge({ role }: { role: string }) {
  if (role === 'OWNER') {
    return <span className="ml-auto text-xs font-medium text-muted-foreground">Owner</span>
  }
  if (role === 'MODERATOR') {
    return (
      <span className="ml-auto rounded bg-info/10 px-1.5 py-0.5 text-xs font-medium text-info">Moderator</span>
    )
  }
  if (role === 'CONTRIBUTOR') {
    return (
      <span className="ml-auto rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">Contributor</span>
    )
  }
  return null
}

function AddMemberDialog({ listId, onSuccess }: { listId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<AssignableRole>('MEMBER')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      await addGroupMember({ listId, username: username.trim(), role })
      setUsername('')
      setRole('MEMBER')
      setOpen(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" data-testid="add-member-button">
          <UserPlusIcon className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Group Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              data-testid="username-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Enter the user&apos;s username to invite them to this group.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AssignableRole)}>
              <SelectTrigger id="role" data-testid="role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MODERATOR">Moderator — can manage members</SelectItem>
                <SelectItem value="CONTRIBUTOR">Contributor — can add markets</SelectItem>
                <SelectItem value="MEMBER">Member — view and trade only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !username.trim()} data-testid="submit-add-member">
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GroupMembersPanel({
  listId,
  canManage,
  currentUserId,
}: {
  listId: string
  /** true if the user is the list owner or an admin */
  canManage: boolean
  currentUserId?: string
}) {
  const { data, isLoading } = useGroupMembers({ listId })

  const members = data?.data ?? []

  // Derive permissions from the current user's group membership
  const currentUserMember = members.find((m) => m.userId === currentUserId)
  const currentUserRole = currentUserMember?.role

  // OWNER or MODERATOR group members can add/remove members (in addition to list owner/admin)
  const effectiveCanManage = canManage || currentUserRole === 'OWNER' || currentUserRole === 'MODERATOR'
  // Only list owner/admin or OWNER group member can change roles
  const canManageRoles = canManage || currentUserRole === 'OWNER'

  const handleRevalidate = () => {
    void mutate(GROUP_MEMBERS_PATH(listId))
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeGroupMember({ listId, userId })
      handleRevalidate()
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateGroupMemberRole({ listId, userId, role })
      handleRevalidate()
    } catch (err) {
      console.error('Failed to update member role:', err)
    }
  }

  return (
    <Card data-testid="group-members-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Members</CardTitle>
          {effectiveCanManage ? <AddMemberDialog listId={listId} onSuccess={handleRevalidate} /> : null}
        </div>
        <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </CardHeader>

      {isLoading ? (
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-8 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      ) : members.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No members yet.{effectiveCanManage ? ' Add members to start the competition.' : ''}
          </p>
        </CardContent>
      ) : (
        <ul className="divide-y divide-muted" data-testid="members-list">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-2 px-4 py-2" data-testid={`member-${member.userId}`}>
              <UserAvatar user={member.user} size="sm" />
              <UserLink
                className="truncate text-sm"
                hideUsername
                user={{ ...member.user, id: member.userId }}
              />
              {canManageRoles && member.role !== 'OWNER' ? (
                <div className="ml-auto flex items-center gap-1">
                  <Select
                    value={member.role}
                    onValueChange={(role) => handleRoleChange(member.userId, role)}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs" data-testid={`role-select-${member.userId}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MODERATOR">Moderator</SelectItem>
                      <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  {member.userId !== currentUserId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.userId)}
                      data-testid={`remove-member-${member.userId}`}
                    >
                      <XIcon className="size-3" />
                    </Button>
                  ) : null}
                </div>
              ) : (
                <>
                  <RoleBadge role={member.role} />
                  {effectiveCanManage && member.userId !== currentUserId && member.role !== 'OWNER' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 size-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.userId)}
                      data-testid={`remove-member-${member.userId}`}
                    >
                      <XIcon className="size-3" />
                    </Button>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
