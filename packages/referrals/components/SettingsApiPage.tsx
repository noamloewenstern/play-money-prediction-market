'use client'

import { format } from 'date-fns'
import { CopyIcon } from 'lucide-react'
import React from 'react'
import { ApiKey } from '@play-money/database'
import { Button } from '@play-money/ui/button'
import { Card, CardContent } from '@play-money/ui/card'
import { toast } from '@play-money/ui/use-toast'

function ClaudeCodeInstallCommand() {
  const command = 'npx play-money@latest install-claude-skills --api-key <your-key> --base-url https://play.money'

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
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
            <div className="mt-4">
              <ClaudeCodeInstallCommand />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {keys.length
                ? 'Run this command in your terminal to install all Play Money skills for Claude Code.'
                : 'Create an API key below first, then use the command above to install skills.'}
            </p>
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
