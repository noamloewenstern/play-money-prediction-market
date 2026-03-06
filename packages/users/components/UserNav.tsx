'use client'

import {
  Laptop,
  Sun,
  Moon,
  Home,
  HelpCircle,
  User,
  List,
  Tag,
  Trophy,
  Settings,
  Shield,
  PlusCircle,
  Clock,
  FileText,
  Bookmark,
  LogOut,
} from 'lucide-react'
import { signOut, signIn } from 'next-auth/react'
import Link from 'next/link'
import React from 'react'
import { useNavigationHistory } from '@play-money/ui'
import { useTheme } from '@play-money/ui/ThemeProvider'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Button } from '@play-money/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@play-money/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@play-money/ui/tabs'
import { useUser } from '@play-money/users/context/UserContext'
import { ActiveUserBalance } from './ActiveUserBalance'

const PAGE_TYPE_ICONS = {
  home: Home,
  question: HelpCircle,
  profile: User,
  list: List,
  tag: Tag,
  leaderboard: Trophy,
  settings: Settings,
  admin: Shield,
  create: PlusCircle,
  other: FileText,
} as const

export function UserNav({ initialBalance }: { initialBalance?: number }) {
  const { user } = useUser()
  const { theme = 'system', setTheme } = useTheme()
  const { recentPages } = useNavigationHistory()

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 px-2 pr-3">
          <UserAvatar user={user} />
          <ActiveUserBalance initialBalance={initialBalance} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 py-0.5">
            <p className="text-sm font-semibold leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/${user.username}`} className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/questions/bookmarks" className="flex items-center gap-2">
              <Bookmark className="size-4 text-muted-foreground" />
              Bookmarks
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>
          {user.role === 'ADMIN' ? (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                Admin
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>

        {recentPages.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="size-3" />
              Recent
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {recentPages.map((page) => {
                const Icon = PAGE_TYPE_ICONS[page.type]
                return (
                  <DropdownMenuItem key={page.path} asChild>
                    <Link href={page.path} className="flex items-center gap-2">
                      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{page.name}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="flex justify-between" onSelect={(e) => e.preventDefault()}>
            <span className="text-muted-foreground">Theme</span>
            <Tabs defaultValue={theme} onValueChange={setTheme}>
              <TabsList className="h-auto p-0.5">
                <TabsTrigger value="system" className="px-1.5 py-1">
                  <Laptop className="size-3.5" />
                </TabsTrigger>
                <TabsTrigger value="light" className="px-1.5 py-1">
                  <Sun className="size-3.5" />
                </TabsTrigger>
                <TabsTrigger value="dark" className="px-1.5 py-1">
                  <Moon className="size-3.5" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-muted-foreground">
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button onClick={() => signIn()}>Sign in</Button>
  )
}
