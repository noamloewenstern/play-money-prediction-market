'use client'

import { format, isPast } from 'date-fns'
import orderBy from 'lodash/orderBy'
import truncate from 'lodash/truncate'
import { BarChart3Icon, CircleCheckBig, ChevronDown, Link2Icon, ListIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { mutate } from 'swr'
import { createComment } from '@play-money/api-helpers/client'
import {
  MARKET_BALANCE_PATH,
  MARKET_GRAPH_PATH,
  MY_BALANCE_PATH,
  useMarketBalance,
} from '@play-money/api-helpers/client/hooks'
import { CreateCommentForm } from '@play-money/comments/components/CreateCommentForm'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { INITIAL_MARKET_LIQUIDITY_PRIMARY } from '@play-money/finance/economy'
import { marketOptionBalancesToProbabilities } from '@play-money/finance/lib/helpers'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Alert, AlertDescription, AlertTitle } from '@play-money/ui/alert'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@play-money/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@play-money/ui/collapsible'
import { ReadMoreEditor } from '@play-money/ui/editor'
import { toast } from '@play-money/ui/use-toast'
import { cn } from '@play-money/ui/utils'
import { CreatorReputationBadge } from '@play-money/users/components/CreatorReputationBadge'
import { UserLink } from '@play-money/users/components/UserLink'
import { useUser } from '@play-money/users/context/UserContext'
import { useSelectedItems } from '../../ui/src/contexts/SelectedItemContext'
import { useSearchParam } from '../../ui/src/hooks/useSearchParam'
import { canModifyMarket, isMarketTradable } from '../rules'
import { ExtendedMarket } from '../types'
import { EditMarketDialog } from './EditMarketDialog'
import { EditMarketOptionDialog } from './EditMarketOptionDialog'
import { LiquidityBoostAlert } from './LiquidityBoostAlert'
import { LiquidityBoostDialog } from './LiquidityBoostDialog'
import { LowLiquidityBanner } from './LowLiquidityBanner'
import { MarketComparisonView } from './MarketComparisonView'
import { MarketGraph } from './MarketGraph'
import { MarketOptionRow } from './MarketOptionRow'
import { MarketListsChip } from './MarketListsChip'
import { MarketStatusBanner } from './MarketStatusBanner'
import { MarketToolbar } from './MarketToolbar'
import { useSidebar } from './SidebarContext'

function getTextContrast(hex: string): string {
  const r = parseInt(hex.substring(1, 3), 16)
  const g = parseInt(hex.substring(3, 5), 16)
  const b = parseInt(hex.substring(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000' : '#FFF'
}

export function MarketOverviewPage({
  market,
  renderActivity,
  onRevalidate,
}: {
  market: ExtendedMarket
  renderActivity: React.ReactNode
  onRevalidate: () => Promise<void>
}) {
  const { user } = useUser()
  const { selected, setSelected } = useSelectedItems()
  const { triggerEffect } = useSidebar()
  const { data: balanceData } = useMarketBalance({ marketId: market.id })
  const balance = balanceData?.data
  const [isEditing, setIsEditing] = useSearchParam('edit')
  const [isEditOption, setIsEditOption] = useSearchParam('editOption')
  const [isBoosting, setIsBoosting] = useSearchParam('boost')
  const isCreator = user?.id === market.createdBy
  const probabilities = marketOptionBalancesToProbabilities(balance?.amm)
  const canEdit = user ? canModifyMarket({ market, user }) : false
  const canTrade = isMarketTradable({ market })
  const isMultiOption = market.options.length >= 3
  const [viewMode, setViewMode] = useState<'compare' | 'list'>(isMultiOption ? 'compare' : 'list')

  const mostLikelyOption = market.options.reduce((prev, current) =>
    (prev.probability || 0) > (current.probability || 0) ? prev : current
  )

  const orderedMarketOptions = orderBy(market.options, 'createdAt')

  const handleRevalidateBalance = async () => {
    void onRevalidate?.()
    void mutate(MY_BALANCE_PATH)
    void mutate(MARKET_BALANCE_PATH(market.id))
    void mutate(MARKET_GRAPH_PATH(market.id))
  }

  const handleCreateComment = async (content: string) => {
    try {
      await createComment({ content, entity: { type: 'MARKET', id: market.id } })
      onRevalidate()
    } catch (error) {
      toast({
        title: 'There was an error creating your comment',
        description: (error as Error).message,
      })
    }
  }

  return (
    <>
      <MarketStatusBanner market={market} />

      <Card className="flex-1">
        <MarketToolbar
          market={market}
          canEdit={canEdit}
          onInitiateEdit={() => setIsEditing('true')}
          onInitiateBoost={() => setIsBoosting('true')}
          onRevalidate={handleRevalidateBalance}
        />

        <CardHeader className="pt-0 md:pt-0">
          {market.parentList ? (
            <Link
              href={`/lists/${market.parentList.id}/${market.parentList.slug}`}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Link2Icon className="size-5" />
              {market.parentList.title}
            </Link>
          ) : null}
          <CardTitle className="leading-relaxed">{market.question}</CardTitle>
          <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground md:flex-nowrap">
            {market.canceledAt ? (
              <Badge variant="secondary" className="font-semibold">Canceled</Badge>
            ) : null}
            {!market.marketResolution && !market.canceledAt ? (
              <span
                data-walkthrough="probability"
                style={{ color: mostLikelyOption.color }}
                className="flex-shrink-0 tabular-nums font-semibold"
              >
                {Math.round(mostLikelyOption.probability || 0)}% {truncate(mostLikelyOption.name, { length: 30 })}
              </span>
            ) : null}
            {market.liquidityCount ? (
              <span className="flex-shrink-0">
                <CurrencyDisplay value={market.liquidityCount} isShort /> Vol.
              </span>
            ) : null}
            {market.closeDate ? (
              <span className="flex-shrink-0">
                {isPast(market.closeDate) ? 'Ended' : 'Ending'} {format(market.closeDate, 'MMM d, yyyy')}
              </span>
            ) : null}
            {market.user ? (
              <span className="flex items-center gap-1.5 truncate">
                <UserAvatar user={market.user} size="sm" />
                <UserLink user={market.user} hideUsername />
                <CreatorReputationBadge userId={market.createdBy} size="sm" />
              </span>
            ) : null}
            {market.lists?.length ? <MarketListsChip lists={market.lists} /> : null}
          </div>
        </CardHeader>
        <CardContent>
          <MarketGraph market={market} activeOptionId={selected[0]} />
        </CardContent>

        <CardContent>
          {market.marketResolution ? (
            <>
              <Alert>
                <CircleCheckBig style={{ color: market.marketResolution.resolution.color }} className="h-4 w-4" />
                <AlertTitle className="flex justify-between">
                  <span className="text-lg leading-none">{market.marketResolution.resolution.name}</span>
                  <Badge
                    style={{
                      backgroundColor: market.marketResolution.resolution.color,
                      color: getTextContrast(market.marketResolution.resolution.color),
                    }}
                  >
                    Resolved
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  By <UserLink user={market.marketResolution.resolvedBy} /> on{' '}
                  {format(market.marketResolution.updatedAt, 'MMM d, yyyy')}
                </AlertDescription>
                {market.marketResolution.supportingLink ? (
                  <AlertDescription>
                    <a
                      href={market.marketResolution.supportingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {market.marketResolution.supportingLink}
                    </a>
                  </AlertDescription>
                ) : null}
              </Alert>
              {orderedMarketOptions.length ? (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="text-muted-foreground" size="sm">
                      View more <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card>
                      {orderedMarketOptions.map((option, i) => (
                        <MarketOptionRow
                          key={option.id}
                          option={option}
                          active={option.id === selected[0]}
                          probability={probabilities[option.id] || option.probability || 0}
                          className={i > 0 ? 'border-t' : ''}
                          canEdit={user ? canModifyMarket({ market, user }) : false}
                          onEdit={() => setIsEditOption(option.id)}
                          onSelect={() => {
                            setSelected([option.id])
                            triggerEffect()
                          }}
                        />
                      ))}
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </>
          ) : orderedMarketOptions.length ? (
            <>
              {isMultiOption ? (
                <div className="mb-2 flex justify-end">
                  <div className="inline-flex items-center rounded-md border p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('compare')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors',
                        viewMode === 'compare' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <BarChart3Icon className="size-3.5" />
                      Compare
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors',
                        viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <ListIcon className="size-3.5" />
                      List
                    </button>
                  </div>
                </div>
              ) : null}
              {viewMode === 'compare' && isMultiOption ? (
                <Card className="p-3">
                  <MarketComparisonView
                    options={orderedMarketOptions}
                    probabilities={probabilities}
                    activeOptionId={selected[0]}
                    marketId={market.id}
                    onSelect={(optionId) => {
                      setSelected([optionId])
                      triggerEffect()
                    }}
                  />
                </Card>
              ) : (
                <Card>
                  {orderedMarketOptions.map((option, i) => (
                    <MarketOptionRow
                      key={option.id}
                      option={option}
                      active={option.id === selected[0]}
                      probability={probabilities[option.id] || option.probability || 0}
                      className={i > 0 ? 'border-t' : ''}
                      canEdit={user ? canModifyMarket({ market, user }) : false}
                      onEdit={() => setIsEditOption(option.id)}
                      onSelect={() => {
                        setSelected([option.id])
                        triggerEffect()
                      }}
                    />
                  ))}
                </Card>
              )}
            </>
          ) : null}
        </CardContent>

        <CardContent className="space-y-4">
          {market.resolutionCriteria ? (
            <div className="rounded-md border border-muted bg-muted/30 p-4">
              <div className="mb-2 text-sm font-semibold text-muted-foreground">Resolution Criteria</div>
              <ReadMoreEditor value={market.resolutionCriteria} maxLines={6} />
            </div>
          ) : null}

          {market.description ? <ReadMoreEditor value={market.description} maxLines={6} /> : null}

          {market.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {market.tags.map((tag) => (
                <Link href={`/questions/tagged/${tag}`} key={tag}>
                  <Badge variant="secondary">{tag}</Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </CardContent>

        {!market.resolvedAt && !market.canceledAt ? (
          <CardContent>
            {(market.liquidityCount ?? 0) <= INITIAL_MARKET_LIQUIDITY_PRIMARY * 1.5 ? (
              <LowLiquidityBanner onClick={() => setIsBoosting('true')} />
            ) : (
              <LiquidityBoostAlert onClick={() => setIsBoosting('true')} />
            )}
          </CardContent>
        ) : null}

        <div className="mx-6 border-t" />

        <div className="flex flex-row items-center justify-between px-6 pt-5">
          <h3 className="text-base font-semibold">Activity</h3>
        </div>

        <div className="mt-3 px-6">
          <CreateCommentForm
            onSubmit={handleCreateComment}
            startCollapsed
            draftKey={`comment-draft-MARKET-${market.id}`}
          />
        </div>
        {renderActivity}

        <EditMarketDialog
          key={market.updatedAt.toString()} // reset form when market updates
          market={market}
          open={isEditing === 'true' && canEdit}
          onClose={() => setIsEditing(undefined)}
          onSuccess={onRevalidate}
        />
        <EditMarketOptionDialog
          market={market}
          optionId={isEditOption!}
          open={isEditOption != null && canEdit}
          onClose={() => setIsEditOption(undefined)}
          onSuccess={onRevalidate}
        />
        <LiquidityBoostDialog
          market={market}
          open={isBoosting === 'true' && canTrade}
          onClose={() => setIsBoosting(undefined)}
          onSuccess={handleRevalidateBalance}
        />
      </Card>
    </>
  )
}
