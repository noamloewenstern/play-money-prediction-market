'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Decimal from 'decimal.js'
import orderBy from 'lodash/orderBy'
import truncate from 'lodash/truncate'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowRightIcon, CircleAlertIcon } from 'lucide-react'
import { createMarketBuy, createMarketSell, getMarketQuote } from '@play-money/api-helpers/client'
import { useConnectionStatus, useStatefulAction } from '@play-money/ui'
import { MarketOption } from '@play-money/database'
import { MarketOptionPositionAsNumbers } from '@play-money/finance/lib/getBalances'
import { type ActionableError, getActionableError } from '@play-money/markets/lib/actionableErrors'
import { Alert, AlertDescription, AlertTitle } from '@play-money/ui/alert'
import { Button } from '@play-money/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { RadioGroup, RadioGroupItem } from '@play-money/ui/radio-group'
import { Slider } from '@play-money/ui/slider'
import { toast } from '@play-money/ui/use-toast'
import { ToastAction } from '@play-money/ui/toast'
import { QuoteItem, calculateReturnPercentage, formatCurrency, formatPercentage } from './MarketBuyForm'

const FormSchema = z.object({
  optionId: z.string(),
  amount: z.coerce.number().min(1, { message: 'Amount must be greater than zero' }),
})

type FormData = z.infer<typeof FormSchema>

export function MarketSellForm({
  marketId,
  options,
  positions,
  onComplete,
}: {
  marketId: string
  options: Array<MarketOption>
  positions?: Array<MarketOptionPositionAsNumbers>
  onComplete?: () => void
}) {
  const { isOnline } = useConnectionStatus()
  const [max, setMax] = useState(0)
  const [quote, setQuote] = useState<{ newProbability: number; potentialReturn: number } | null>(null)
  const [tradeError, setTradeError] = useState<ActionableError | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { actionState: confirmActionState, setLoading: setConfirmLoading, setSuccess: setConfirmSuccess, setError: setConfirmError } = useStatefulAction()
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      optionId: options[0].id,
    },
  })

  const selectedOption = options.find((o) => o.id === form.getValues('optionId'))
  const selectedPosition = positions?.find((p) => p.optionId === form.getValues('optionId'))
  const currentProbability = selectedOption?.probability ?? 0

  const handleUndo = async (optionId: string, returnAmount: number) => {
    try {
      await createMarketBuy({ marketId, optionId, amount: Math.round(returnAmount) })
      toast({
        title: 'Trade undone',
        description: 'Your sale has been reversed.',
        variant: 'default',
      })
      onComplete?.()
    } catch (error) {
      console.error('Failed to undo trade:', error)
      toast({
        title: 'Undo failed',
        description: error instanceof Error ? error.message : 'Could not reverse the trade.',
        variant: 'destructive',
      })
    }
  }

  const executeTrade = async (data: FormData) => {
    try {
      setTradeError(null)
      setConfirmLoading()
      const option = options.find((o) => o.id === data.optionId)
      const returnAmount = quote?.potentialReturn ?? 0
      const newProb = quote?.newProbability
      await createMarketSell({ marketId: marketId, optionId: data.optionId, amount: data.amount })

      const optionId = data.optionId
      const roundedReturn = Math.round(returnAmount)

      setConfirmSuccess()
      toast({
        title: `Sold ${data.amount} shares of ${option?.name ?? 'Unknown'}`,
        description: newProb != null
          ? `Return: ${formatCurrency(returnAmount)} · probability now ${formatPercentage(newProb)}`
          : `Return: ${formatCurrency(returnAmount)}`,
        variant: 'success',
        action: roundedReturn > 0 ? (
          <ToastAction altText="Undo trade" onClick={() => handleUndo(optionId, returnAmount)}>
            Undo
          </ToastAction>
        ) : undefined,
      })
      form.reset({ amount: 0 })
      setQuote(null)
      setShowConfirmation(false)
      onComplete?.()
    } catch (error: unknown) {
      console.error('Failed to sell shares:', error)
      setTradeError(getActionableError(error))
      setConfirmError()
    }
  }

  const onSubmit = async (data: FormData) => {
    setShowConfirmation(true)
  }

  const fetchQuote = async (amount: number, optionId: string) => {
    try {
      const { data } = await getMarketQuote({ marketId, optionId, amount, isBuy: false })
      setQuote(data)
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  useEffect(() => {
    form.setValue('optionId', options[0].id)
  }, [options])

  useEffect(() => {
    if (selectedPosition?.quantity) {
      setMax(selectedPosition.quantity)
      form.setValue('amount', Math.round(selectedPosition.quantity / 2))
    } else {
      form.setValue('amount', 0)
    }
  }, [form.watch('optionId'), selectedPosition])

  useEffect(() => {
    const amount = form?.getValues('amount')
    const optionId = form?.getValues('optionId')
    if (amount && optionId) {
      fetchQuote(amount, optionId)
    }

    const subscription = form.watch(({ amount, optionId }) => {
      setTradeError(null)
      setShowConfirmation(false)
      if (amount && optionId) {
        fetchQuote(amount, optionId)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, options])

  const proportionateCost = selectedPosition?.quantity
    ? (form.getValues('amount') * (selectedPosition?.cost || 0)) / selectedPosition.quantity
    : 0
  const disabled = !selectedPosition || new Decimal(selectedPosition.quantity).toDecimalPlaces(4).lte(0)
  const orderedOptions = orderBy(options, 'createdAt')
  const sellAmount = form.getValues('amount')
  const pricePerShare = sellAmount > 0 && quote ? quote.potentialReturn / sellAmount : 0

  if (showConfirmation && quote) {
    return (
      <div className="space-y-4" data-testid="trade-confirmation">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfirmation(false)}
            className="text-muted-foreground hover:text-foreground"
            data-testid="trade-confirmation-back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Confirm Trade</span>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="mb-3 text-sm font-medium">Sell {truncate(selectedOption?.name, { length: 30 })}</div>
          <ul className="grid gap-2 text-sm">
            <QuoteItem label="Shares to sell" value={sellAmount} formatter={(v) => Math.round(v).toString()} />
            <QuoteItem label="Avg price per share" value={pricePerShare} formatter={(v) => `¤${v.toFixed(2)}`} />
            <QuoteItem
              label="You will receive"
              value={quote.potentialReturn}
              formatter={formatCurrency}
              percent={calculateReturnPercentage(quote.potentialReturn, proportionateCost)}
            />
          </ul>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Probability Impact</div>
          <div className="flex items-center justify-between text-sm">
            <span className="tabular-nums">{formatPercentage(currentProbability)}</span>
            <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="tabular-nums font-semibold text-foreground">{formatPercentage(quote.newProbability)}</span>
          </div>
        </div>

        {tradeError ? (
          <Alert variant="destructive" className="py-3">
            <CircleAlertIcon className="h-4 w-4" />
            <AlertTitle>{tradeError.title}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{tradeError.description}</span>
              {tradeError.action ? (
                <Button variant="outline" size="sm" className="w-fit" asChild>
                  <Link href={tradeError.action.href}>{tradeError.action.label}</Link>
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          className="w-full"
          actionState={confirmActionState}
          disabled={!isOnline}
          onClick={() => void executeTrade(form.getValues())}
          data-testid="trade-confirmation-confirm"
        >
          Confirm Trade
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {orderedOptions.length > 1 ? (
          <FormField
            control={form.control}
            name="optionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                    {orderedOptions.map((option) => (
                      <FormItem key={option.id} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={option.id} />
                        </FormControl>
                        <FormLabel className="font-normal">{option.name}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">Amount</FormLabel>
              <FormControl>
                <div>
                  <Slider
                    className="my-4"
                    min={1}
                    max={max}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    disabled={disabled}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(e.currentTarget.valueAsNumber)}
                      className="h-9 tabular-nums"
                      disabled={disabled}
                    />

                    <Button
                      size="sm"
                      type="button"
                      variant="secondary"
                      onClick={() => field.onChange(max)}
                      disabled={disabled}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tradeError ? (
          <Alert variant="destructive" className="py-3">
            <CircleAlertIcon className="h-4 w-4" />
            <AlertTitle>{tradeError.title}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{tradeError.description}</span>
              {tradeError.action ? (
                <Button variant="outline" size="sm" className="w-fit" asChild>
                  <Link href={tradeError.action.href}>{tradeError.action.label}</Link>
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          className="w-full truncate"
          loading={form.formState.isSubmitting}
          disabled={disabled || !isOnline}
        >
          Sell {truncate(selectedOption?.name, { length: 20 })}
        </Button>

        <ul className="grid gap-1 text-sm">
          <QuoteItem
            label="Potential return"
            value={quote?.potentialReturn}
            formatter={formatCurrency}
            percent={calculateReturnPercentage(quote?.potentialReturn, proportionateCost)}
          />
          <QuoteItem label="New probability" value={quote?.newProbability} formatter={formatPercentage} />
        </ul>
      </form>
    </Form>
  )
}
