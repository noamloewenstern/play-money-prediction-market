'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { debounce } from 'lodash'
import { CheckCircle2Icon } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getUserCheckUsername, updateMe } from '@play-money/api-helpers/client'
import { User } from '@play-money/database'
import { Avatar, AvatarFallback, AvatarImage } from '@play-money/ui/avatar'
import { Button } from '@play-money/ui/button'
import { Combobox } from '@play-money/ui/combobox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { Textarea } from '@play-money/ui/textarea'
import { toast } from '@play-money/ui/use-toast'
import { cn } from '@play-money/ui/utils'
import { useUser } from '../context/UserContext'

// Monkey patch for es2022
declare namespace Intl {
  type Key = 'calendar' | 'collation' | 'currency' | 'numberingSystem' | 'timeZone' | 'unit'

  function supportedValuesOf(input: Key): Array<string>

  type DateTimeFormatOptions = {
    timeZone: string
    timeZoneName: string
  }
  class DateTimeFormat {
    constructor(locale: string, options: DateTimeFormatOptions)
    format(date: Date): string
  }
}

const USERNAME_MAX_LENGTH = 30
const DISPLAY_NAME_MAX_LENGTH = 50
const BIO_MAX_LENGTH = 500

const profileFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }).max(USERNAME_MAX_LENGTH, {
    message: `Username must be ${USERNAME_MAX_LENGTH} characters or less`,
  }),
  displayName: z.string().min(1, { message: 'Display name is required' }).max(DISPLAY_NAME_MAX_LENGTH, {
    message: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or less`,
  }),
  bio: z.string().max(BIO_MAX_LENGTH, { message: `Bio must be ${BIO_MAX_LENGTH} characters or less` }).nullable(),
  avatarUrl: z.string().nullable(),
  timezone: z.string(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function SettingsProfileForm({
  hasImageUpload = false,
  onImageUpload,
}: {
  hasImageUpload?: boolean
  onImageUpload?: (file: FormData) => Promise<string>
}) {
  const { user, setUser } = useUser()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      displayName: user?.displayName ?? '',
      timezone: user?.timezone ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
    mode: 'onBlur',
  })

  const {
    formState: { isSubmitting, isDirty, isValid },
  } = form

  async function onSubmit(data: ProfileFormValues) {
    try {
      const { data: user } = await updateMe(data)

      setUser(user)
      toast({
        title: 'Your profile has been updated',
      })
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: (error as Error).message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {hasImageUpload ? (
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field: { value, ...field } }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Avatar className="size-32">
                      <AvatarImage
                        alt={`@${user?.username}`}
                        className="object-cover"
                        src={value || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username}&scale=75`}
                      />
                      <AvatarFallback />
                    </Avatar>
                    <Input
                      {...field}
                      onChange={async (event) => {
                        const file = event.target.files?.[0]

                        if (file) {
                          const formData = new FormData()
                          formData.append('image', file)

                          const img = await onImageUpload?.(formData)
                          if (img) {
                            form.setValue('avatarUrl', img, { shouldValidate: true, shouldDirty: true })
                          }
                        }
                      }}
                      type="file"
                      className="w-64"
                    />
                  </div>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => {
            const len = field.value?.length ?? 0
            const isNearLimit = len > DISPLAY_NAME_MAX_LENGTH * 0.8
            const fieldState = form.getFieldState('displayName')
            const isValid = fieldState.isDirty && !fieldState.invalid && len > 0
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Display name</FormLabel>
                  {isValid ? <CheckCircle2Icon className="size-4 text-success" /> : null}
                </div>
                <FormControl>
                  <Input placeholder="Display name" maxLength={DISPLAY_NAME_MAX_LENGTH} {...field} />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormDescription>
                    This is your public display name. It can be your real name or a pseudonym.
                  </FormDescription>
                  <span
                    className={cn(
                      'shrink-0 text-xs',
                      isNearLimit ? 'text-warning' : 'text-muted-foreground',
                      len >= DISPLAY_NAME_MAX_LENGTH && 'text-destructive'
                    )}
                  >
                    {len}/{DISPLAY_NAME_MAX_LENGTH}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )
          }}
        />
        <FormField
          control={form.control}
          name="username"
          rules={{
            validate: debounce(
              async (value: string) => {
                if (user?.username === value) {
                  return true
                }
                const {
                  data: { available, message },
                } = await getUserCheckUsername({ username: value })
                return available || message || 'There is an error with that username'
              },
              500,
              { leading: true }
            ),
          }}
          render={({ field }) => {
            const len = field.value?.length ?? 0
            const isNearLimit = len > USERNAME_MAX_LENGTH * 0.8
            const fieldState = form.getFieldState('username')
            const isValid = fieldState.isDirty && !fieldState.invalid && len > 0
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Username</FormLabel>
                  {isValid ? <CheckCircle2Icon className="size-4 text-success" /> : null}
                </div>
                <FormControl>
                  <Input placeholder="username" maxLength={USERNAME_MAX_LENGTH} {...field} />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormDescription>This is your username. It is unique to you on the site.</FormDescription>
                  <span
                    className={cn(
                      'shrink-0 text-xs',
                      isNearLimit ? 'text-warning' : 'text-muted-foreground',
                      len >= USERNAME_MAX_LENGTH && 'text-destructive'
                    )}
                  >
                    {len}/{USERNAME_MAX_LENGTH}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )
          }}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field: { value, ...restField } }) => {
            const len = value?.length ?? 0
            const isNearLimit = len > BIO_MAX_LENGTH * 0.8
            return (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little bit about yourself"
                    className="resize-none"
                    maxLength={BIO_MAX_LENGTH}
                    value={value ?? ''}
                    {...restField}
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormMessage />
                  <span
                    className={cn(
                      'ml-auto text-xs',
                      isNearLimit ? 'text-warning' : 'text-muted-foreground',
                      len >= BIO_MAX_LENGTH && 'text-destructive'
                    )}
                  >
                    {len}/{BIO_MAX_LENGTH}
                  </span>
                </div>
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field: { ref, ...field } }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Combobox
                  buttonClassName="w-full"
                  {...field}
                  items={Intl.supportedValuesOf('timeZone').map((tz) => {
                    const offset = new Intl.DateTimeFormat('en-US', {
                      timeZone: tz,
                      timeZoneName: 'shortOffset',
                    })
                      .format(new Date())
                      .split(' ')
                      .pop()
                    return { value: tz, label: `${tz} (${offset})`, keywords: [...tz.split(' ')] }
                  })}
                />
              </FormControl>
              <FormDescription>
                This will be used for sending notifications, daily quest resets and displaying times in your local
                timezone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={!isDirty || !isValid} loading={isSubmitting}>
          Update profile
        </Button>
      </form>
    </Form>
  )
}
