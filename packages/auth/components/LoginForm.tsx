'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { signIn } from 'next-auth/react'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { Alert, AlertDescription } from '@play-money/ui/alert'
import { Button } from '@play-money/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@play-money/ui/tabs'
import { toast } from '@play-money/ui/use-toast'

const MagicLinkSchema = z.object({ email: z.string().email() })
type MagicLinkData = z.infer<typeof MagicLinkSchema>

const PasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type PasswordData = z.infer<typeof PasswordSchema>

function MagicLinkForm() {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm({
    resolver: zodResolver(MagicLinkSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: MagicLinkData) => {
    try {
      setIsLoading(true)
      await signIn('resend', { email: data.email, callbackUrl: '/' })
    } catch (error: unknown) {
      console.error('Login Failed:', error)
      toast({ title: 'Sign-in failed', description: 'Could not send magic link. Please check your email and try again.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" loading={isLoading}>
          Sign in with email
        </Button>
      </form>

      <Alert variant="muted">
        <Sparkles className="h-4 w-4" />
        <div />
        <AlertDescription>We will email you a magic link for a password-free sign in.</AlertDescription>
      </Alert>
    </Form>
  )
}

function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: PasswordData) => {
    setError(null)
    setIsLoading(true)

    try {
      if (isRegister) {
        // Register first, then sign in
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        })

        if (!res.ok) {
          const { error: errMsg } = await res.json()
          setError(errMsg || 'Registration failed')
          return
        }
      }

      // Sign in with credentials
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError(isRegister ? 'Registration succeeded but sign in failed. Try signing in.' : 'Invalid email or password')
        return
      }

      // Redirect on success
      window.location.href = '/'
    } catch (err: unknown) {
      console.error('Auth error:', err)
      setError('Unable to connect. Please check your internet connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="Password" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" loading={isLoading}>
          {isRegister ? 'Create account' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" className="underline hover:text-primary" onClick={() => { setIsRegister(!isRegister); setError(null) }}>
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </form>
    </Form>
  )
}

export function LoginForm() {
  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
      </TabsList>
      <TabsContent value="password" className="mt-4">
        <PasswordForm />
      </TabsContent>
      <TabsContent value="magic-link" className="mt-4">
        <MagicLinkForm />
      </TabsContent>
    </Tabs>
  )
}
