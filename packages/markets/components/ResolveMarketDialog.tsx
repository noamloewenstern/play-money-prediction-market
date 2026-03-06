'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { createMarketResolve } from '@play-money/api-helpers/client'
import { useStatefulAction } from '@play-money/ui'
import { Button } from '@play-money/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@play-money/ui/dialog'
import { ReadMoreEditor } from '@play-money/ui/editor'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { Label } from '@play-money/ui/label'
import { RadioGroup, RadioGroupItem } from '@play-money/ui/radio-group'
import { toast } from '@play-money/ui/use-toast'
import { ExtendedMarket } from '../types'

const FormSchema = z.object({
  optionId: z.string().nonempty({ message: 'You must select an option' }),
  supportingLink: z.string().url({ message: 'Supporting link must be a valid URL' }).optional(),
})

type FormData = z.infer<typeof FormSchema>

export const ResolveMarketDialog = ({
  open,
  onClose,
  onSuccess,
  market,
}: {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  market: ExtendedMarket
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  })

  const { actionState: resolveActionState, setLoading: setResolveLoading, setSuccess: setResolveSuccess, setError: setResolveError } = useStatefulAction()

  const onSubmit = async (data: FormData) => {
    try {
      setResolveLoading()
      await createMarketResolve({ marketId: market.id, optionId: data.optionId, supportingLink: data.supportingLink })

      setResolveSuccess()
      toast({ title: 'Market resolved successfully' })
      form.reset()
      onClose()
      onSuccess?.()
    } catch (error: unknown) {
      console.error('Failed to resolve market:', error)
      setResolveError()
      toast({
        title: 'There was an issue resolving the market',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      })
    }
  }

  const {
    formState: { isSubmitting, isDirty, isValid },
  } = form

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Market "{market.question}"</DialogTitle>
        </DialogHeader>

        <ReadMoreEditor value={market.description} maxLines={6} editorProps={{ inputClassName: 'text-sm' }} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="optionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select the option to resolve as true:</FormLabel>
                  <FormControl>
                    <RadioGroup {...field} onValueChange={field.onChange}>
                      {market.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2" style={{ color: option.color }}>
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id}>
                            {option.name} ({Math.round(option.probability || 0)}%)
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
              name="supportingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Supporting link: <span className="text-primary">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="http://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={!isDirty || !isValid} actionState={resolveActionState} className="w-full">
              Resolve
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
