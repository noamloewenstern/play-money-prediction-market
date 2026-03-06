'use client'

import { format } from 'date-fns'
import { ChevronDownIcon, CopyIcon } from 'lucide-react'
import React from 'react'
import { ApiKey } from '@play-money/database'
import { Button } from '@play-money/ui/button'
import { Card, CardContent } from '@play-money/ui/card'
import { toast } from '@play-money/ui/use-toast'

function CopyableCommand({ command, label }: { command: string; label?: string }) {
  return (
    <div className="relative">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      <pre className="overflow-x-auto rounded-md bg-muted p-4 pr-20 text-sm">
        <code>{command}</code>
      </pre>
      <Button
        className="absolute right-2 top-2"
        size="sm"
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(command)
          toast({ title: 'Command copied to clipboard' })
        }}
      >
        <CopyIcon className="h-4 w-4" />
        Copy
      </Button>
    </div>
  )
}

const EXAMPLE_PROMPTS = [
  { category: 'Discover', prompts: [
    'Browse open markets tagged "politics" sorted by close date',
    'Search markets about "Apple Vision" and show top 5',
  ]},
  { category: 'Trade', prompts: [
    'Get a quote to buy \u20AE50 YES on market 123',
    'Buy \u20AE50 YES on market 123 (confirm when asked)',
  ]},
  { category: 'Portfolio', prompts: [
    'Show my positions grouped by market with unrealized P&L',
    'Check my Play Money balance',
  ]},
  { category: 'Create', prompts: [
    'Create a market about the next Fed decision with 3 options',
    'Suggest 5 prediction markets about AI developments',
  ]},
  { category: 'Insights', prompts: [
    'Show the monthly leaderboard',
    'Summarize recent site-wide trading activity and trends',
  ]},
]

const SKILLS_TABLE = [
  { name: 'browse-markets', description: 'List & filter markets', endpoints: 'GET /markets' },
  { name: 'search', description: 'Full-text search', endpoints: 'GET /search' },
  { name: 'trade', description: 'Buy or sell shares', endpoints: 'POST /markets/:id/buy, /sell' },
  { name: 'portfolio', description: 'View open positions & P&L', endpoints: 'GET /users/me/positions' },
  { name: 'check-balance', description: 'Show balance & quest status', endpoints: 'GET /users/me' },
  { name: 'create-market', description: 'Create new markets', endpoints: 'POST /markets' },
  { name: 'resolve-market', description: 'Resolve or cancel (admin)', endpoints: 'POST /markets/:id/resolve' },
  { name: 'add-liquidity', description: 'Deposit liquidity', endpoints: 'POST /markets/:id/liquidity' },
  { name: 'leaderboard', description: 'Monthly rankings', endpoints: 'GET /leaderboard' },
  { name: 'activity-feed', description: 'Recent activity & trends', endpoints: 'GET /transactions' },
  { name: 'suggest-markets', description: 'AI market suggestions', endpoints: 'N/A (LLM-generated)' },
]

export function SettingsApiPage({ keys, onCreateKey }: { keys: Array<ApiKey>; onCreateKey: () => Promise<void> }) {
  return (
    <div className="grid gap-8 ">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API</h1>
          <p className="mt-2 text-muted-foreground">
            Include{' '}
            <code className="rounded bg-muted px-1 py-1 text-foreground">x-api-key: &#123;&#123;key&#125;&#125;</code>{' '}
            in the header of your requests.
          </p>
        </div>
        <Card className="bg-muted/50">
          <CardContent className="md:pt-6">
            <h2 className="text-xl font-bold">API Reference</h2>
            <div className="mt-4 flex items-center justify-between">
              <a className="text-lg font-medium underline" href={process.env.NEXT_PUBLIC_API_URL} target="_blank">
                {process.env.NEXT_PUBLIC_API_URL}
              </a>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="md:pt-6">
            <h2 className="text-xl font-bold">Claude Code Integration</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Install Claude Code skills to interact with Play Money from your terminal using natural language. Browse
              markets, execute trades, manage your portfolio, and more.
            </p>

            <div className="mt-4 space-y-3">
              <CopyableCommand
                label="Install"
                command="npx play-money@latest install-claude-skills --api-key <your-key> --base-url https://play.money"
              />
              <div className="flex gap-3">
                <CopyableCommand
                  label="Verify"
                  command="npx play-money@latest verify-claude-skills --online"
                />
                <CopyableCommand
                  label="List"
                  command="npx play-money@latest list-claude-skills"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {keys.length
                ? 'Run the install command in your terminal to install all Play Money skills for Claude Code.'
                : 'Create an API key below first, then use the install command above.'}
            </p>

            <details className="mt-6">
              <summary className="flex cursor-pointer items-center gap-1 text-sm font-medium">
                <ChevronDownIcon className="h-4 w-4" />
                Example Prompts
              </summary>
              <div className="mt-3 space-y-4">
                {EXAMPLE_PROMPTS.map((group) => (
                  <div key={group.category}>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.category}
                    </h4>
                    <ul className="mt-1 space-y-1">
                      {group.prompts.map((prompt) => (
                        <li key={prompt} className="text-sm">
                          <code className="rounded bg-muted px-1.5 py-0.5">{prompt}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>

            <details className="mt-4">
              <summary className="flex cursor-pointer items-center gap-1 text-sm font-medium">
                <ChevronDownIcon className="h-4 w-4" />
                Available Skills ({SKILLS_TABLE.length})
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pr-4">Skill</th>
                      <th className="pb-2 pr-4">Description</th>
                      <th className="pb-2">Key Endpoints</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SKILLS_TABLE.map((skill) => (
                      <tr key={skill.name} className="border-b last:border-0">
                        <td className="py-1.5 pr-4 font-mono text-xs">{skill.name}</td>
                        <td className="py-1.5 pr-4">{skill.description}</td>
                        <td className="py-1.5 font-mono text-xs text-muted-foreground">{skill.endpoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="md:pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Keys</h2>
            {!keys.length && (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await onCreateKey()
                  } catch (error) {
                    console.error(error) // eslint-disable-line no-console -- ignore
                    toast({ title: 'Failed to create API key', variant: 'destructive' })
                  }
                }}
              >
                Create Key
              </Button>
            )}
          </div>
          {keys.length ? (
            <div className="mt-4 space-y-4">
              {keys.map((key) => (
                <div>
                  <div key={key.id} className="flex items-center justify-between">
                    <span>
                      {key.keyPrefix}{'••••••••'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Created <time dateTime={key.createdAt.toString()}>{format(key.createdAt, 'MMM d, yyyy')}</time>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-4">No keys yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
