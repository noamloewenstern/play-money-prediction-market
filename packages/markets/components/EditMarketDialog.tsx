'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CheckCircle2Icon } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { updateMarket } from '@play-money/api-helpers/client'
import { MarketSchema, Market } from '@play-money/database'
import { Button } from '@play-money/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@play-money/ui/dialog'
import { Editor } from '@play-money/ui/editor'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { MultiSelect } from '@play-money/ui/multi-select'
import { toast } from '@play-money/ui/use-toast'
import { cn } from '@play-money/ui/utils'

const QUESTION_MAX_LENGTH = 200
const TAG_MAX_COUNT = 5

const FormSchema = MarketSchema.pick({
  question: true,
  description: true,
  resolutionCriteria: true,
  tags: true,
}).extend({
  question: z.string().trim().min(1, { message: 'Question is required' }).max(QUESTION_MAX_LENGTH, {
    message: `Question must be ${QUESTION_MAX_LENGTH} characters or less`,
  }),
  closeDate: z.coerce.date().nullable().refine(
    (date) => !date || date > new Date(),
    { message: 'Close date must be in the future' }
  ),
  tags: z.string().trim().array().max(TAG_MAX_COUNT, { message: `Maximum ${TAG_MAX_COUNT} tags allowed` }),
})

type FormData = z.infer<typeof FormSchema>

// Copied from https://github.com/orgs/react-hook-form/discussions/1991
function getDirtyValues<DirtyFields extends Record<string, unknown>, Values extends Record<keyof DirtyFields, unknown>>(
  dirtyFields: DirtyFields,
  values: Values
): Partial<typeof values> {
  const dirtyValues = Object.keys(dirtyFields).reduce((prev, key) => {
    if (!dirtyFields[key]) return prev

    return {
      ...prev,
      [key]:
        typeof dirtyFields[key] === 'object'
          ? getDirtyValues(dirtyFields[key] as DirtyFields, values[key] as Values)
          : values[key],
    }
  }, {})

  return dirtyValues
}

export const EditMarketDialog = ({
  open,
  onClose,
  onSuccess,
  market,
}: {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  market: Market
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      question: market.question,
      description: market.description || '<p></p>',
      resolutionCriteria: market.resolutionCriteria ?? null,
      closeDate: market.closeDate,
      tags: market.tags,
    },
    mode: 'onBlur',
  })

  const {
    formState: { isSubmitting, isDirty, isValid },
  } = form

  const onSubmit = async (data: FormData) => {
    try {
      const changedData = getDirtyValues(form.formState.dirtyFields, data)
      await updateMarket({ marketId: market.id, body: changedData })
      toast({ title: 'Market edited successfully' })
      form.reset()
      onSuccess?.()
      onClose()
    } catch (error: unknown) {
      console.error('Failed to edit market:', error)
      toast({
        title: 'Failed to edit market',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Market</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => {
                const len = field.value?.length ?? 0
                const isNearLimit = len > QUESTION_MAX_LENGTH * 0.8
                const fieldState = form.getFieldState('question')
                const isValid = fieldState.isDirty && !fieldState.invalid && len > 0
                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Question</FormLabel>
                      {isValid ? <CheckCircle2Icon className="size-4 text-success" /> : null}
                    </div>
                    <FormControl>
                      <Input placeholder="Title" maxLength={QUESTION_MAX_LENGTH} {...field} />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <span
                        className={cn(
                          'ml-auto text-xs',
                          isNearLimit ? 'text-warning' : 'text-muted-foreground',
                          len >= QUESTION_MAX_LENGTH && 'text-destructive'
                        )}
                      >
                        {len}/{QUESTION_MAX_LENGTH}
                      </span>
                    </div>
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name="resolutionCriteria"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>Resolution criteria</FormLabel>
                  <FormControl>
                    <div className="min-h-[80px]">
                      <Editor
                        inputClassName="border text-sm p-3 min-h-[80px]"
                        placeholder="Define the conditions for YES/NO resolution..."
                        value={value ?? ''}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <div className="min-h-[80px]">
                      <Editor
                        inputClassName="border text-sm p-3 min-h-[80px]"
                        placeholder="Additional context or background information..."
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Tags</FormLabel>
                    <span className={cn(
                      'text-xs',
                      (value?.length ?? 0) >= TAG_MAX_COUNT ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {value?.length ?? 0}/{TAG_MAX_COUNT}
                    </span>
                  </div>
                  <FormControl>
                    <MultiSelect
                      value={value?.map((v) => ({ value: v, label: v }))}
                      onChange={(values) => onChange(values?.map((v) => v.value))}
                      hideClearAllButton
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closeDate"
              render={({ field }) => {
                const closeDateState = form.getFieldState('closeDate')
                const isCloseDateValid = field.value && !closeDateState.invalid && field.value > new Date()
                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Close Date</FormLabel>
                      {isCloseDateValid ? <CheckCircle2Icon className="size-4 text-success" /> : null}
                    </div>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="w-auto"
                        onChange={(e) => {
                          try {
                            format(e.target.value, "yyyy-MM-dd'T'hh:mm") // Throws error if invalid date
                            field.onChange(new Date(e.target.value))
                          } catch (error) {
                            console.error('Failed to parse date:', error)
                          }
                        }}
                        value={field.value ? format(field.value, "yyyy-MM-dd'T'hh:mm") : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <Button disabled={!isDirty || !isValid} loading={isSubmitting} type="submit">
              Publish market edits
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
