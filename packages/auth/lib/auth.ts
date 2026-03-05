import bcrypt from 'bcryptjs'
import NextAuth, { NextAuthConfig, NextAuthResult } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Resend from 'next-auth/providers/resend'
import db from '@play-money/database'
import { PrismaAdapter } from './auth-prisma-adapter'

// Re-declare the internal type that NextAuth uses but doesn't export,
// so TypeScript can name the inferred type of `auth`.
declare module 'next-auth' {
  interface AppRouteHandlerFn {
    (req: Request, ctx: { params: Record<string, string> }): Promise<Response>
  }
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set')
}

const useSecureCookies = process.env.NEXTAUTH_URL.startsWith('https://')
const cookiePrefix = useSecureCookies ? '__Secure-' : ''
const hostName = new URL(process.env.NEXTAUTH_URL).hostname

const providers: NextAuthConfig['providers'] = [
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined
      const password = credentials?.password as string | undefined

      if (!email || !password) {
        return null
      }

      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, email: true, emailVerified: true, passwordHash: true },
      })

      if (!user?.passwordHash) {
        return null
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return null
      }

      return { id: user.id, email: user.email }
    },
  }),
]

// Only add Resend provider if configured
if (process.env.AUTH_RESEND_EMAIL) {
  providers.push(
    Resend({
      from: process.env.AUTH_RESEND_EMAIL,
    })
  )
}

const nextAuthConfig: NextAuthConfig = {
  trustHost: true,
  adapter: PrismaAdapter(db),
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/check-email',
    newUser: '/setup',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Support cookies on different subdomains
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: `.${hostName}`,
        secure: useSecureCookies,
      },
    },
  },

  providers,

  callbacks: {
    async signIn({ user }) {
      const whitelist = process.env.AUTH_EMAIL_WHITELIST
      if (whitelist) {
        const allowed = whitelist.split(',').map((e) => e.trim().toLowerCase())
        if (!user.email || !allowed.includes(user.email.toLowerCase())) {
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

const nextAuth = NextAuth(nextAuthConfig)
export const signIn: NextAuthResult['signIn'] = nextAuth.signIn
export const auth: NextAuthResult['auth'] = nextAuth.auth
export const handlers: NextAuthResult['handlers'] = nextAuth.handlers
export const signOut: NextAuthResult['signOut'] = nextAuth.signOut
