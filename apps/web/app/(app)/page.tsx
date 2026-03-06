import { ArrowRightIcon, MinusIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { getLists, getMarkets } from '@play-money/api-helpers/client'
import { SiteActivity } from '@play-money/finance/components/SiteActivity'
import { MarketProbabilityDetail } from '@play-money/markets/components/MarketProbabilityDetail'
import { PersonalizedFeed } from '@play-money/markets/components/PersonalizedFeed'
import { UserQuestCard } from '@play-money/quests/components/UserQuestCard'
import { SidebarReferralAlert } from '@play-money/referrals/components/SidebarReferralAlert'
import { SignedInReferralAlert } from '@play-money/referrals/components/SignedInReferralAlert'
import { formatDistanceToNowShort } from '@play-money/ui'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Card } from '@play-money/ui/card'

export default async function AppPage() {
  const { data: closingMarkets } = await getMarkets({ sortField: 'closeDate', sortDirection: 'asc', limit: 5 })
  const { data: newMarkets } = await getMarkets({ limit: 10 })
  const { data: newLists } = await getLists({ limit: 5 })

  return (
    <div className="mx-auto flex max-w-screen-lg flex-1 flex-col gap-8 md:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <PersonalizedFeed />

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/50 px-5 py-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Closing soon</h4>

            <Link
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              href="/questions?sort=closeDate-asc"
            >
              View all
              <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          <div className="divide-y font-mono text-sm">
            {closingMarkets.map((market) => {
              return (
                <div
                  className="flex flex-col transition-colors hover:bg-muted/30 sm:flex-row"
                  key={market.id}
                >
                  <Link
                    className="flex-[3] px-5 pb-1 pt-3 leading-snug visited:text-muted-foreground sm:py-3"
                    href={`/questions/${market.id}/${market.slug}`}
                  >
                    <span className="line-clamp-2">{market.question}</span>
                  </Link>

                  <div className="flex flex-[2] items-center">
                    <Link className="flex-1 px-3 py-2 sm:py-3" href={`/questions/${market.id}/${market.slug}`}>
                      {market.canceledAt ? (
                        <div className="text-muted-foreground">
                          <span className="font-semibold">Canceled</span>
                        </div>
                      ) : market.marketResolution ? (
                        <div className="text-muted-foreground">
                          <span className="font-semibold">Resolved</span> {market.marketResolution.resolution.name}
                        </div>
                      ) : (
                        <MarketProbabilityDetail options={market.options} />
                      )}
                    </Link>
                    <div className="px-4 py-2 sm:py-3">
                      {market.closeDate ? (
                        <div className="text-xs text-muted-foreground">{formatDistanceToNowShort(market.closeDate)}</div>
                      ) : (
                        <MinusIcon className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/50 px-5 py-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent lists</h4>
          </div>

          <div className="divide-y font-mono text-sm">
            {newLists.map((list) => {
              return (
                <div
                  className="flex flex-col transition-colors hover:bg-muted/30 sm:flex-row"
                  key={list.id}
                >
                  <Link
                    className="flex-[3] px-5 pb-1 pt-3 leading-snug visited:text-muted-foreground sm:py-3"
                    href={`/lists/${list.id}/${list.slug}`}
                  >
                    <span className="line-clamp-2">{list.title}</span>
                  </Link>

                  <div className="flex flex-[2] items-center">
                    <Link className="flex-1 px-3 py-2 sm:py-3" href={`/lists/${list.id}/${list.slug}`}>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {list.markets.slice(0, 5).map((m) => (
                          <span className="inline pr-1" key={m.market.id}>
                            <span
                              className="mb-0.5 mr-1 inline-block size-1.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: m.market.options[0].color }}
                            />
                            {m.market.question}
                          </span>
                        ))}
                      </span>
                    </Link>
                    <div className="px-4 py-2 sm:py-3">
                      <Link href={`/${list.owner.username}`}>
                        <UserAvatar size="sm" user={list.owner} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/50 px-5 py-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent questions</h4>

            <Link
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              href="/questions"
            >
              View all
              <ArrowRightIcon className="size-3" />
            </Link>
          </div>

          <div className="divide-y font-mono text-sm">
            {newMarkets.map((market) => {
              return (
                <div
                  className="flex flex-col transition-colors hover:bg-muted/30 sm:flex-row"
                  key={market.id}
                >
                  <Link
                    className="flex-[3] px-5 pb-1 pt-3 leading-snug visited:text-muted-foreground sm:py-3"
                    href={`/questions/${market.id}/${market.slug}`}
                  >
                    <span className="line-clamp-2">{market.question}</span>
                  </Link>

                  <div className="flex flex-[2] items-center">
                    <Link className="flex-1 px-3 py-2 sm:py-3" href={`/questions/${market.id}/${market.slug}`}>
                      {market.canceledAt ? (
                        <div className="text-muted-foreground">
                          <span className="font-semibold">Canceled</span>
                        </div>
                      ) : market.marketResolution ? (
                        <div className="text-muted-foreground">
                          <span className="font-semibold">Resolved</span> {market.marketResolution.resolution.name}
                        </div>
                      ) : (
                        <MarketProbabilityDetail options={market.options} />
                      )}
                    </Link>
                    <div className="px-4 py-2 sm:py-3">
                      <Link href={`/${market.user.username}`}>
                        <UserAvatar size="sm" user={market.user} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-6 md:w-80">
        <SidebarReferralAlert />
        <UserQuestCard />

        <div>
          <div className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</div>
          <SiteActivity />
        </div>

        <SignedInReferralAlert />
      </div>
    </div>
  )
}
