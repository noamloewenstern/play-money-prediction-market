'use client'

import React, { useState, useCallback, useEffect } from 'react'
import debounce from 'lodash/debounce'
import truncate from 'lodash/truncate'
import { CircleAlertIcon } from 'lucide-react'
import { mutate } from 'swr'
import { createMarketBuy, createMarketSell, getMarketQuote } from '@play-money/api-helpers/client'
import { MARKET_BALANCE_PATH, MARKET_GRAPH_PATH, MY_BALANCE_PATH } from '@play-money/api-helpers/client/hooks'
import { MarketOption } from '@play-money/database'
import { type ActionableError, getActionableError } from '@play-money/markets/lib/actionableErrors'
import { useStatefulAction } from '@play-money/ui'
import { Button } from '@play-money/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@play-money/ui/popover'
import { toast } from '@play-money/ui/use-toast'
import { ToastAction } from '@play-money/ui/toast'
import { cn } from '@play-money/ui/utils'
import { formatCurrency, formatPercentage } from './MarketBuyForm'

const PRESET_AMOUNTS = [100, 500, 1000]

export function QuickTradePopover({
  marketId,
  options,
  children,
}: {
  marketId: string
  options: Array<MarketOption>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState(options[0]?.id)
  const [amount, setAmount] = useState<number | null>(null)
  const [quote, setQuote] = useState<{ newProbability: number; potentialReturn: number } | null>(null)
  const { actionState: quickTradeState, setLoading: setQuickLoading, setSuccess: setQuickSuccess, setError: setQuickError } = useStatefulAction()
  const [tradeError, setTradeError] = useState<ActionableError | null>(null)

  const selectedOption = options.find((o) => o.id === selectedOptionId)

  const fetchQuote = async (amt: number, optionId: string) => {
    try {
      const { data } = await getMarketQuote({ marketId, optionId, amount: amt })
      setQuote(data)
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchQuote = useCallback(debounce(fetchQuote, 300), [marketId])

  useEffect(() => {
    return () => {
      debouncedFetchQuote.cancel()
    }
  }, [debouncedFetchQuote])

  const handleAmountSelect = (amt: number) => {
    setAmount(amt)
    setQuote(null)
    setTradeError(null)
    debouncedFetchQuote(amt, selectedOptionId)
  }

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId)
    setTradeError(null)
    if (amount) {
      setQuote(null)
      debouncedFetchQuote(amount, optionId)
    }
  }

  const handleUndo = async (optionId: string, sharesReceived: number) => {
    try {
      await createMarketSell({ marketId, optionId, amount: Math.round(sharesReceived) })
      toast({
        title: 'Trade undone',
        description: 'Your purchase has been reversed.',
        variant: 'default',
      })
      void mutate(MY_BALANCE_PATH)
    } catch (error) {
      console.error('Failed to undo trade:', error)
      toast({
        title: 'Undo failed',
        description: error instanceof Error ? error.message : 'Could not reverse the trade.',
        variant: 'destructive',
      })
    }
  }

  const handleBuy = async () => {
    if (!amount || !selectedOptionId) return

    try {
      setTradeError(null)
      setQuickLoading()
      const sharesReceived = quote?.potentialReturn ?? 0
      const newProb = quote?.newProbability

      await createMarketBuy({ marketId, optionId: selectedOptionId, amount })

      const optionId = selectedOptionId
      const roundedShares = Math.round(sharesReceived)

      setQuickSuccess()
      toast({
        title: `Bought ${formatCurrency(amount)} of ${truncate(selectedOption?.name, { length: 20 })}`,
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

      void mutate(MY_BALANCE_PATH)
      void mutate(MARKET_BALANCE_PATH(marketId))
      void mutate(MARKET_GRAPH_PATH(marketId))

      setOpen(false)
      setAmount(null)
      setQuote(null)
    } catch (error: unknown) {
      console.error('Quick trade failed:', error)
      setTradeError(getActionableError(error))
      setQuickError()
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setAmount(null)
      setQuote(null)
      setTradeError(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.preventDefault()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Quick Trade</div>

          {options.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                    selectedOptionId === option.id
                      ? 'border-transparent text-white'
                      : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                  style={
                    selectedOptionId === option.id ? { backgroundColor: option.color } : undefined
                  }
                >
                  {truncate(option.name, { length: 15 })}{' '}
                  <span className="tabular-nums">{Math.round(option.probability || 0)}%</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: selectedOption?.color }}>
              {truncate(selectedOption?.name, { length: 20 })}{' '}
              <span className="tabular-nums">{Math.round(selectedOption?.probability || 0)}%</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Amount</div>
            <div className="flex gap-1.5">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={amount === preset ? 'default' : 'secondary'}
                  className="h-7 flex-1 tabular-nums text-xs"
                  onClick={() => handleAmountSelect(preset)}
                >
                  ¤{preset}
                </Button>
              ))}
            </div>
          </div>

          {amount && quote ? (
            <div className="space-y-1 rounded-md bg-muted/50 p-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return</span>
                <span className="tabular-nums font-semibold">
                  {formatCurrency(quote.potentialReturn)}{' '}
                  <span
                    className={cn(
                      quote.potentialReturn - amount > 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    ({Math.round(((quote.potentialReturn - amount) / amount) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New prob</span>
                <span className="tabular-nums font-semibold">{formatPercentage(quote.newProbability)}</span>
              </div>
            </div>
          ) : null}

          {tradeError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              <div className="flex items-center gap-1 font-semibold">
                <CircleAlertIcon className="size-3" />
                {tradeError.title}
              </div>
              <p className="mt-0.5">{tradeError.description}</p>
            </div>
          ) : null}

          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={!amount || !quote}
            actionState={quickTradeState}
            onClick={handleBuy}
          >
            {amount ? `Buy ${truncate(selectedOption?.name, { length: 15 })}` : 'Select amount'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
