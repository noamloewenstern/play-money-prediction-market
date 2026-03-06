import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SWRProvider } from '@play-money/api-helpers/components/SWRProvider'
import { auth } from '@play-money/auth'
import { SessionProvider } from '@play-money/auth/components/SessionProvider'
import { LazyEditorExtensions } from '@play-money/comments/components/LazyEditorExtensions'
import { ReferralProvider } from '@play-money/referrals/components/ReferralContext'
import { ThemeProvider } from '@play-money/ui/ThemeProvider'
import '@play-money/ui/emoji'
import '@play-money/ui/styles.css'
import { Toaster } from '@play-money/ui/toaster'
import { TooltipProvider } from '@play-money/ui/tooltip'
import { ConnectionStatusProvider, NavigationHistoryProvider } from '@play-money/ui'
import { UserProvider } from '@play-money/users/context/UserContext'
import { getUserById } from '@play-money/users/lib/getUserById'
import { ServiceWorkerRegistration } from './components/ServiceWorkerRegistration'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Play Money',
  description: 'Prediction market platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Play Money',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7c3aed' },
    { media: '(prefers-color-scheme: dark)', color: '#7c3aed' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user?.id ? await getUserById({ id: session.user.id }) : null

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
          <SWRProvider>
            <SessionProvider session={session}>
              <UserProvider user={user}>
                <LazyEditorExtensions>
                  <ReferralProvider>
                    <ConnectionStatusProvider>
                      <NavigationHistoryProvider>
                        <TooltipProvider>{children}</TooltipProvider>
                      </NavigationHistoryProvider>
                    </ConnectionStatusProvider>
                  </ReferralProvider>
                </LazyEditorExtensions>
              </UserProvider>
            </SessionProvider>
            <Toaster />
          </SWRProvider>
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
