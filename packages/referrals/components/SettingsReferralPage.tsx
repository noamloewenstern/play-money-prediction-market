'use client'

import { format } from 'date-fns'
import { CheckIcon, CopyIcon, GiftIcon, MailIcon, MessageCircleIcon, UserPlusIcon } from 'lucide-react'
import React, { useState } from 'react'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import {
  DAILY_COMMENT_BONUS_PRIMARY,
  DAILY_LIQUIDITY_BONUS_PRIMARY,
  DAILY_MARKET_BONUS_PRIMARY,
  DAILY_TRADE_BONUS_PRIMARY,
} from '@play-money/finance/economy'
import { User } from '@play-money/database'
import { UserAvatar } from '@play-money/ui/UserAvatar'
import { Badge } from '@play-money/ui/badge'
import { Button } from '@play-money/ui/button'
import { Card, CardContent } from '@play-money/ui/card'
import { UserLink } from '@play-money/users/components/UserLink'
import { useUser } from '@play-money/users/context/UserContext'

const BONUS =
  DAILY_TRADE_BONUS_PRIMARY * 7 +
  DAILY_MARKET_BONUS_PRIMARY * 7 +
  DAILY_COMMENT_BONUS_PRIMARY * 7 +
  DAILY_LIQUIDITY_BONUS_PRIMARY * 7

function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button size="sm" onClick={handleCopy} data-testid="copy-link-button">
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  )
}

function ShareButtons({ link }: { link: string }) {
  const twitterMessage = `I'm trading on prediction markets at Play Money! Join me and we both earn bonus currency to start trading. ${link}`
  const discordMessage = `Check out Play Money - a prediction market platform! Sign up with my referral link and we both get bonus currency: ${link}`
  const emailSubject = 'Join me on Play Money - Prediction Markets'
  const emailBody = `Hey!\n\nI've been using Play Money to trade on prediction markets and thought you'd enjoy it too.\n\nIf you sign up using my referral link, we both earn bonus currency to start trading:\n${link}\n\nSee you there!`

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(twitterUrl, '_blank', 'noopener,noreferrer')}
        data-testid="share-twitter"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(discordMessage)
        }}
        data-testid="share-discord"
      >
        <MessageCircleIcon className="h-4 w-4" />
        Copy for Discord
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(emailUrl, '_self')}
        data-testid="share-email"
      >
        <MailIcon className="h-4 w-4" />
        Send via Email
      </Button>
    </div>
  )
}

function ReferralPreview() {
  return (
    <Card className="border-info/30 bg-info/5">
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <UserPlusIcon className="size-3" />
          What your friend sees
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-info/10">
              <GiftIcon className="size-5 text-info" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">You&apos;ve been invited!</p>
              <p className="text-xs text-muted-foreground">
                Sign up and earn up to <CurrencyDisplay value={BONUS} isShort /> in bonus currency by completing quests
                during your first week.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReferralEmptyState({ link }: { link: string }) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <UserPlusIcon className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Share your referral link</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Invite friends and you both earn rewards. No limits on referrals!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <GiftIcon className="size-3.5" />
                You earn up to <CurrencyDisplay value={BONUS} isShort />
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <GiftIcon className="size-3.5" />
                They earn up to <CurrencyDisplay value={BONUS} isShort />
              </Badge>
            </div>
          </div>

          <div className="mt-6 rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 truncate font-mono text-sm" data-testid="referral-link">
                {link}
              </div>
              <CopyLinkButton link={link} />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Share via</p>
            <ShareButtons link={link} />
          </div>
        </CardContent>
      </Card>

      <ReferralPreview />
    </div>
  )
}

export function SettingsReferralPage({ referrals }: { referrals: Array<User> }) {
  const { user } = useUser()
  const link = `${process.env.NEXT_PUBLIC_WEB_URL}?ref=${user?.referralCode}`

  return (
    <div className="grid gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="mt-2 text-muted-foreground">
            For every person who signs up using your link and completes quests during their first week, you'll receive
            instant bonuses. As they continue to complete more quests over time, you'll recieve additional bonuses!
          </p>
          <p className="mt-2 text-muted-foreground">
            There's no limit to the number of people you can refer, so the more you share, the more you can earn!
          </p>
        </div>

        {referrals.length === 0 ? (
          <ReferralEmptyState link={link} />
        ) : (
          <Card className="bg-muted/50">
            <CardContent className="md:pt-6">
              <h2 className="text-xl font-bold">Your Referral Link</h2>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 truncate text-lg font-medium">{link}</div>
                <CopyLinkButton link={link} />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Share via</p>
                <ShareButtons link={link} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Card>
        <CardContent className="md:pt-6">
          <h2 className="text-xl font-bold">Referred Users</h2>
          <div className="mt-4 space-y-4">
            {referrals.length ? (
              referrals.map((referral) => (
                <div key={referral.id} className="flex items-center gap-2">
                  <UserAvatar user={referral} size="sm" />
                  <UserLink user={referral} className="line-clamp-1" />
                  <div className="ml-auto flex-shrink-0 text-sm text-muted-foreground">
                    Signed up on {format(referral.createdAt, 'MMM d, yyyy')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No referrals yet. Share your link above to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
