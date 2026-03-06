import { zodResolver } from '@hookform/resolvers/zod'
import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CommentSchema } from '@play-money/database'
import { useStatefulAction } from '@play-money/ui'
import { Button } from '@play-money/ui/button'
import { Card } from '@play-money/ui/card'
import { DraftRecoveryBanner } from '@play-money/ui/DraftRecoveryBanner'
import { Editor } from '@play-money/ui/editor'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@play-money/ui/form'
import { cn } from '@play-money/ui/utils'

const FormSchema = CommentSchema.pick({ content: true })

type FormData = z.infer<typeof FormSchema>

const EMPTY_CONTENT = '<p></p>'

function isContentEmpty(content: string) {
  return !content || content === EMPTY_CONTENT || content === '<p></p>\n'
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function CreateCommentForm({
  initialContent,
  variant = 'default',
  startCollapsed = false,
  focusOnRender,
  draftKey,
  onSubmit,
  onCancel,
}: {
  initialContent?: string
  variant?: 'default' | 'reply' | 'edit'
  startCollapsed?: boolean
  focusOnRender?: boolean
  draftKey?: string
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
}) {
  const [draftState] = useState(() => {
    if (!draftKey || typeof window === 'undefined') return { hasDraft: false, preview: undefined as string | undefined }
    const saved = localStorage.getItem(draftKey)
    if (saved && !isContentEmpty(saved)) {
      const text = stripHtml(saved)
      return {
        hasDraft: true,
        preview: text.length > 80 ? text.slice(0, 80) + '...' : text,
      }
    }
    return { hasDraft: false, preview: undefined }
  })

  const [hasDraft, setHasDraft] = useState(draftState.hasDraft)

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: initialContent || EMPTY_CONTENT,
    },
  })

  // Save draft on content changes
  const watchedContent = form.watch('content')
  useEffect(() => {
    if (!draftKey) return
    if (isContentEmpty(watchedContent)) {
      localStorage.removeItem(draftKey)
    } else {
      localStorage.setItem(draftKey, watchedContent)
    }
  }, [watchedContent, draftKey])

  const handleRestore = useCallback(() => {
    if (!draftKey) return
    const saved = localStorage.getItem(draftKey)
    if (saved && !isContentEmpty(saved)) {
      form.reset({ content: saved })
    }
    setHasDraft(false)
  }, [draftKey, form])

  const handleDiscard = useCallback(() => {
    if (draftKey) {
      localStorage.removeItem(draftKey)
    }
    form.reset({ content: EMPTY_CONTENT })
    setHasDraft(false)
  }, [draftKey, form])

  const { actionState: commentActionState, setLoading: setCommentLoading, setSuccess: setCommentSuccess, setError: setCommentError } = useStatefulAction()

  const handleSubmit = async (data: FormData) => {
    try {
      setCommentLoading()
      await onSubmit(data.content)
      if (draftKey) {
        localStorage.removeItem(draftKey)
      }
      setCommentSuccess()
    } catch (error) {
      setCommentError()
      throw error
    }
  }

  useEffect(
    function resetFormAfterSubmit() {
      if (form.formState.isSubmitSuccessful) {
        form.reset({ content: EMPTY_CONTENT })
      }
    },
    [form.formState]
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {hasDraft ? (
          <DraftRecoveryBanner preview={draftState.preview} onRestore={handleRestore} onDiscard={handleDiscard} />
        ) : null}
        <Card className="group ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field: { ref: _, ...field } }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Editor
                      placeholder={
                        variant === 'reply'
                          ? 'Write a reply...'
                          : variant === 'edit'
                            ? 'Edit comment...'
                            : 'Write a comment...'
                      }
                      className="min-h-14"
                      focusOnRender={focusOnRender}
                      shortcuts={{
                        'Mod-Enter': () => {
                          if (form.formState.isDirty && form.formState.isValid) {
                            form.handleSubmit(handleSubmit)()
                          }
                          return true
                        },
                        Escape: () => {
                          if (!form.formState.isDirty) {
                            onCancel?.()
                          }
                          return true
                        },
                      }}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <div
            className={cn(
              '-mt-4 flex flex-row justify-end group-focus-within:flex',
              startCollapsed && 'hidden',
              form.formState.isDirty && 'flex'
            )}
          >
            {onCancel ? (
              <Button variant="ghost" type="button" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}

            <Button
              variant="ghost"
              type="submit"
              disabled={!form.formState.isDirty || !form.formState.isValid}
              actionState={commentActionState}
            >
              {variant === 'reply' ? 'Reply' : variant === 'edit' ? 'Edit' : 'Comment'}
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  )
}
