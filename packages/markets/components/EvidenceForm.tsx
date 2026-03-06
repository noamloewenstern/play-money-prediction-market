'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { EvidenceType, createMarketEvidence } from '@play-money/api-helpers/client'
import { useStatefulAction } from '@play-money/ui'
import { Button } from '@play-money/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { RadioGroup, RadioGroupItem } from '@play-money/ui/radio-group'
import { Textarea } from '@play-money/ui/textarea'
import { toast } from '@play-money/ui/use-toast'
import { Label } from '@play-money/ui/label'
import { cn } from '@play-money/ui/utils'

const FormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(200),
  content: z.string().min(1, { message: 'Content is required' }).max(2000),
  url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  evidenceType: z.enum(['FOR', 'AGAINST', 'NEUTRAL']),
})

type FormData = z.infer<typeof FormSchema>

export function EvidenceForm({
  marketId,
  onSuccess,
}: {
  marketId: string
  onSuccess?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { actionState, setLoading, setSuccess, setError } = useStatefulAction()

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      content: '',
      url: '',
      evidenceType: 'NEUTRAL',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading()
      await createMarketEvidence({
        marketId,
        title: data.title,
        content: data.content,
        url: data.url || undefined,
        evidenceType: data.evidenceType as EvidenceType,
      })
      setSuccess()
      toast({ title: 'Evidence submitted successfully' })
      form.reset()
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      setError()
      toast({
        title: 'Failed to submit evidence',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      })
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="flex items-center gap-1.5">
        <PlusIcon className="size-4" />
        Add Evidence
      </Button>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-md border p-4">
        <FormField
          control={form.control}
          name="evidenceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stance</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  {(['FOR', 'NEUTRAL', 'AGAINST'] as const).map((type) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <RadioGroupItem value={type} id={`type-${type}`} />
                      <Label
                        htmlFor={`type-${type}`}
                        className={cn(
                          'cursor-pointer font-medium',
                          type === 'FOR' && 'text-success',
                          type === 'AGAINST' && 'text-destructive',
                          type === 'NEUTRAL' && 'text-muted-foreground'
                        )}
                      >
                        {type === 'FOR' ? 'For' : type === 'AGAINST' ? 'Against' : 'Neutral'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief summary of the evidence..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide more details about this evidence..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset()
              setIsOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" actionState={actionState}>
            Submit Evidence
          </Button>
        </div>
      </form>
    </Form>
  )
}
