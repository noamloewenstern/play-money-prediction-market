'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import debounce from 'lodash/debounce'
import orderBy from 'lodash/orderBy'
import truncate from 'lodash/truncate'
import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowRightIcon, CircleAlertIcon } from 'lucide-react'
import { createMarketBuy, createMarketSell, getMarketQuote } from '@play-money/api-helpers/client'
import { useConnectionStatus, useStatefulAction } from '@play-money/ui'
import { MarketOption } from '@play-money/database'
import { DAILY_TRADE_BONUS_PRIMARY } from '@play-money/finance/economy'
import { type ActionableError, getActionableError } from '@play-money/markets/lib/actionableErrors'
import { Alert, AlertDescription, AlertTitle } from '@play-money/ui/alert'
import { Button } from '@play-money/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { RadioGroup, RadioGroupItem } from '@play-money/ui/radio-group'
import { toast } from '@play-money/ui/use-toast'
import { ToastAction } from '@play-money/ui/toast'
import { cn } from '@play-money/ui/utils'

const FormSchema = z.object({
  optionId: z.string(),
  amount: z.coerce.number().min(1, { message: 'Amount must be greater than zero' }),
})

type FormData = z.infer<typeof FormSchema>

export function MarketBuyForm({
  marketId,
  options,
  onComplete,
}: {
  marketId: string
  options: Array<MarketOption>
  onComplete?: () => void
}) {
  const { isOnline } = useConnectionStatus()
  const [quote, setQuote] = useState<{ newProbability: number; potentialReturn: number } | null>(null)
  const [tradeError, setTradeError] = useState<ActionableError | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: DAILY_TRADE_BONUS_PRIMARY,
      optionId: options[0].id,
    },
  })

  const selectedOption = options.find((o) => o.id === form.getValues('optionId'))
  const currentProbability = selectedOption?.probability ?? 0

  const handleUndo = async (optionId: string, sharesReceived: number) => {
    try {
      await createMarketSell({ marketId, optionId, amount: Math.round(sharesReceived) })
      toast({
        title: 'Trade undone',
        description: 'Your purchase has been reversed.',
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

  const { actionState: confirmActionState, setLoading: setConfirmLoading, setSuccess: setConfirmSuccess, setError: setConfirmError } = useStatefulAction()

  const executeTrade = async (data: FormData) => {
    try {
      setTradeError(null)
      setConfirmLoading()
      const option = options.find((o) => o.id === data.optionId)
      const sharesReceived = quote?.potentialReturn ?? 0
      const newProb = quote?.newProbability
      await createMarketBuy({ marketId, optionId: data.optionId, amount: data.amount })

      const optionId = data.optionId
      const roundedShares = Math.round(sharesReceived)

      setConfirmSuccess()
      toast({
        title: `Bought ${formatCurrency(data.amount)} of ${option?.name ?? 'Unknown'}`,
        description: newProb != null
          ? `${roundedShares} shares · probability now ${formatPercentage(newProb)}`
          : `${roundedShares} shares acquired`,
        variant: 'success',
        action: roundedShares > 0 ? (
          <ToastAction altText="Undo trade" onClick={() => handleUndo(optionId, sharesReceived)}>
            Undo
          </ToastAction>
        ) : undefined,
      })
      form.reset({ amount: DAILY_TRADE_BONUS_PRIMARY })
      setQuote(null)
      setShowConfirmation(false)
      onComplete?.()
    } catch (error: unknown) {
      console.error('Failed to place bet:', error)
      setTradeError(getActionableError(error))
      setConfirmError()
    }
  }

  const onSubmit = async (data: FormData) => {
    setShowConfirmation(true)
  }

  const fetchQuote = async (amount: number, optionId: string) => {
    try {
      const { data } = await getMarketQuote({ marketId, optionId, amount })
      setQuote(data)
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchQuote = useCallback(debounce(fetchQuote, 300), [marketId])

  useEffect(() => {
    form.setValue('optionId', options[0].id)
  }, [options])

  useEffect(() => {
    const amount = form?.getValues('amount')
    const optionId = form?.getValues('optionId')

    if (amount && optionId) {
      debouncedFetchQuote(amount, optionId)
    }

    const subscription = form.watch(({ amount, optionId }) => {
      setTradeError(null)
      setShowConfirmation(false)
      if (amount && optionId) {
        debouncedFetchQuote(amount, optionId)
      }
    })
    return () => {
      subscription.unsubscribe()
      debouncedFetchQuote.cancel()
    }
  }, [form, options, debouncedFetchQuote])

  const orderedOptions = orderBy(options, 'createdAt')
  const amount = form.getValues('amount')
  const sharesReceived = quote ? quote.potentialReturn : 0
  const avgPricePerShare = sharesReceived > 0 ? amount / sharesReceived : 0

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
          <div className="mb-3 text-sm font-medium">Buy {truncate(selectedOption?.name, { length: 30 })}</div>
          <ul className="grid gap-2 text-sm">
            <QuoteItem label="Total cost" value={amount} formatter={formatCurrency} />
            <QuoteItem
              label="Shares to receive"
              value={sharesReceived}
              formatter={(v) => Math.round(v).toString()}
            />
            <QuoteItem label="Avg price per share" value={avgPricePerShare} formatter={(v) => `¤${v.toFixed(2)}`} />
            <QuoteItem
              label="Potential payout"
              value={quote.potentialReturn}
              formatter={formatCurrency}
              percent={calculateReturnPercentage(quote.potentialReturn, amount)}
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
              <FormLabel className="flex items-center justify-between">
                Amount
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="secondary"
                    className="h-6 px-2 tabular-nums"
                    onClick={() => field.onChange((field.value || 0) + DAILY_TRADE_BONUS_PRIMARY)}
                  >
                    +{DAILY_TRADE_BONUS_PRIMARY}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="secondary"
                    className="h-6 px-2 tabular-nums"
                    onClick={() => field.onChange((field.value || 0) + 250)}
                  >
                    +250
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="secondary"
                    className="h-6 px-2 tabular-nums"
                    onClick={() => field.onChange((field.value || 0) + 1000)}
                  >
                    +1k
                  </Button>
                </div>
              </FormLabel>
              <FormControl>
                <div className="space-y-2" data-walkthrough="amount-input">
                  <Input
                    type="number"
                    placeholder={String(DAILY_TRADE_BONUS_PRIMARY)}
                    {...field}
                    onChange={(e) => field.onChange(e.currentTarget.valueAsNumber)}
                    className="h-9 tabular-nums"
                  />
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

        <Button type="submit" className="w-full truncate" loading={form.formState.isSubmitting} disabled={!isOnline}>
          Buy {truncate(selectedOption?.name, { length: 20 })}
        </Button>

        <ul className="grid gap-1 text-sm">
          <QuoteItem
            label="Potential return"
            value={quote?.potentialReturn}
            formatter={formatCurrency}
            percent={calculateReturnPercentage(quote?.potentialReturn, form.getValues('amount'))}
          />
          <QuoteItem label="New probability" value={quote?.newProbability} formatter={formatPercentage} />
        </ul>
      </form>
    </Form>
  )
}

// TODO: Create format components and using existing currency component
export const formatCurrency = (value: number) => `¤${Math.round(value)}`

export const formatPercentage = (value: number) => `${value}%`

export const calculateReturnPercentage = (potentialReturn = 0, amount = 0) => {
  return ((potentialReturn - amount) / amount) * 100
}

export const QuoteItem = ({
  label,
  value,
  percent,
  formatter = (value) => value.toString(),
  className,
}: {
  label: string
  value?: number
  percent?: number
  formatter?: (value: number) => string
  className?: string
}) => (
  <li className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={cn(
        'tabular-nums font-semibold',
        value
          ? percent
            ? percent > 0
              ? 'text-success'
              : percent < 0
                ? 'text-destructive'
                : 'text-foreground'
            : 'text-foreground'
          : 'text-muted-foreground'
      )}
    >
      {value ? (percent ? `${formatter(value)} (${Math.round(percent)}%)` : formatter(value)) : '—'}
    </span>
  </li>
)
