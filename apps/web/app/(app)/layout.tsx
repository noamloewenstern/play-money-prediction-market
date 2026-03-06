import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { getMyBalance } from '@play-money/api-helpers/client'
import { NotificationDropdown } from '@play-money/notifications/components/NotificationDropdown'
import { UserQuestCard } from '@play-money/quests/components/UserQuestCard'
import { GlobalSearchTriggerLink } from '@play-money/search/components/GlobalSearchTriggerLink'
import { Button } from '@play-money/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@play-money/ui/sheet'
import { cn } from '@play-money/ui/utils'
import { UserNav } from '@play-money/users/components/UserNav'

function MainNav({
  className,
  renderItemWrap = (children) => children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { renderItemWrap?: (children: React.ReactNode) => React.ReactNode }) {
  return (
    <nav className={cn('flex items-center text-sm', className)} {...props}>
      {renderItemWrap(
        <Link
          className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          href="/questions"
        >
          Questions
        </Link>
      )}
      {renderItemWrap(
        <Link
          className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          href="/create-post"
        >
          Create Question
        </Link>
      )}
      {renderItemWrap(
        <Link
          className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          href="/leaderboard"
        >
          Leaderboard
        </Link>
      )}
      {renderItemWrap(
        <GlobalSearchTriggerLink className="h-auto rounded-md px-3 py-1.5 text-[length:inherit] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
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
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4 md:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="ghost">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col" side="left">
              <div className="flex flex-1 flex-col gap-4">
                <span className="text-lg font-bold tracking-tight">PlayMoney</span>
                <MainNav
                  className="flex flex-col items-start space-y-1 text-lg"
                  renderItemWrap={(child) => <SheetClose asChild>{child}</SheetClose>}
                />
              </div>
              <UserQuestCard />
            </SheetContent>
          </Sheet>
          <Link className="flex items-center gap-2" href="/">
            <span className="text-lg font-bold tracking-tight">PlayMoney</span>
          </Link>
          <MainNav className="hidden gap-1 md:flex" />

          <div className="ml-auto flex items-center space-x-2">
            <NotificationDropdown />
            <UserNav initialBalance={initialBalance} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-screen-xl flex-1 space-y-4 p-4 md:p-8">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-screen-xl gap-4 px-4 py-6 text-sm text-muted-foreground md:px-8">
          <a
            className="transition-colors hover:text-foreground hover:underline"
            href="https://discord.gg/Q5CeSMFeBP"
            rel="noreferrer"
            target="_blank"
          >
            Join the discord
          </a>
          <span className="text-border">|</span>
          <a
            className="transition-colors hover:text-foreground hover:underline"
            href="https://github.com/casesandberg/play-money"
            rel="noreferrer"
            target="_blank"
          >
            Open source
          </a>
        </div>
      </footer>
    </div>
  )
}
