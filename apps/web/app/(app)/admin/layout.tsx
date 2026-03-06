import { redirect } from 'next/navigation'
import { auth } from '@play-money/auth'
import { Separator } from '@play-money/ui/separator'
import { getUserById } from '@play-money/users/lib/getUserById'
import { isAdmin } from '@play-money/users/rules'
import { AdminSidebarNav } from './AdminSidebarNav'

const sidebarNavItems = [
  { title: 'Overview', href: '/admin' },
  { title: 'Users', href: '/admin/users' },
  { title: 'Markets', href: '/admin/markets' },
  { title: 'Comments', href: '/admin/comments' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await getUserById({ id: session.user.id })
  if (!isAdmin({ user })) {
    redirect('/')
  }

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Manage users, markets, and platform settings.</p>
      </div>
      <Separator className="my-6" />
      <div className="grid space-y-8 lg:grid-cols-5 lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:col-span-1">
          <AdminSidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:col-span-4">{children}</div>
      </div>
    </div>
  )
}
