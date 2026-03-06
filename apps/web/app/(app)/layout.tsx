import { MenuIcon, TrendingUpIcon, PlusCircleIcon, TrophyIcon } from 'lucide-react'
import Link from 'next/link'
import { getMyBalance } from '@play-money/api-helpers/client'
import { LocationChip } from '@play-money/ui/LocationChip'
import { OfflineBanner } from '@play-money/ui/OfflineBanner'
import { URLBreadcrumb } from '@play-money/ui/URLBreadcrumb'
import { NotificationDropdown } from '@play-money/notifications/components/NotificationDropdown'
import { UserQuestCard } from '@play-money/quests/components/UserQuestCard'
import { GlobalSearchTriggerLink } from '@play-money/search/components/GlobalSearchTriggerLink'
import { Button } from '@play-money/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@play-money/ui/sheet'
import { cn } from '@play-money/ui/utils'
import { UserNav } from '@play-money/users/components/UserNav'
import { KeyboardShortcutsProvider } from '../components/KeyboardShortcutsProvider'

function MainNav({
  className,
  renderItemWrap = (children) => children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { renderItemWrap?: (children: React.ReactNode) => React.ReactNode }) {
  return (
    <nav className={cn('flex items-center text-sm', className)} {...props}>
      {renderItemWrap(
        <Link
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          href="/questions"
        >
          <TrendingUpIcon className="size-4" />
          Questions
        </Link>
      )}
      {renderItemWrap(
        <Link
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          href="/create-post"
        >
          <PlusCircleIcon className="size-4" />
          Create
        </Link>
      )}
      {renderItemWrap(
        <Link
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          href="/leaderboard"
        >
          <TrophyIcon className="size-4" />
          Leaderboard
        </Link>
      )}
      {renderItemWrap(
        <GlobalSearchTriggerLink className="h-auto rounded-lg px-3 py-2 text-[length:inherit] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
      )}
    </nav>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let initialBalance
  try {
    const {
      data: { balance },
    } = await getMyBalance()
    initialBalance = balance
  } catch (_error) {
    // Ignore
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <KeyboardShortcutsProvider />
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between gap-4 px-4 md:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="ghost">
                <MenuIcon className="size-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-6" side="left">
              <Link className="flex items-center gap-2" href="/">
                <span className="text-lg font-bold tracking-tight">PlayMoney</span>
              </Link>
              <MainNav
                className="flex flex-col items-start gap-1 text-base"
                renderItemWrap={(child) => <SheetClose asChild>{child}</SheetClose>}
              />
              <div className="mt-auto">
                <UserQuestCard />
              </div>
            </SheetContent>
          </Sheet>
          <LocationChip className="md:hidden" />
          <Link className="hidden items-center gap-2 md:flex" href="/">
            <span className="text-lg font-bold tracking-tight">PlayMoney</span>
          </Link>
          <MainNav className="hidden gap-0.5 md:flex" />

          <div className="ml-auto flex items-center gap-1">
            <NotificationDropdown />
            <UserNav initialBalance={initialBalance} />
          </div>
        </div>
      </header>

      <OfflineBanner />

      <div className="mx-auto w-full max-w-screen-xl px-4 pt-3 md:px-8">
        <URLBreadcrumb />
      </div>
      <main className="mx-auto flex w-full max-w-screen-xl flex-1 space-y-4 p-4 md:p-8">{children}</main>

      <footer className="border-t bg-muted/20">
        <div className="mx-auto flex max-w-screen-xl items-center gap-6 px-4 py-5 text-sm text-muted-foreground md:px-8">
          <span className="font-semibold text-foreground/70">PlayMoney</span>
          <a
            className="transition-colors hover:text-foreground"
            href="https://discord.gg/Q5CeSMFeBP"
            rel="noreferrer"
            target="_blank"
          >
            Discord
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/casesandberg/play-money"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
