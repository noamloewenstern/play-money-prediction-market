import { NextResponse } from 'next/server'
import type { SchemaResponse } from '@play-money/api-helpers'
import schema from './schema'

export const dynamic = 'force-dynamic'

const SKILLS = [
  {
    name: 'play-money-browse-markets',
    description: 'List, filter, and explore prediction markets with current probabilities',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-browse-markets',
  },
  {
    name: 'play-money-search',
    description: 'Full-text search across markets, users, and lists with current odds',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-search',
  },
  {
    name: 'play-money-trade',
    description: 'Buy or sell shares on a market option with pre-trade quotes',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-trade',
  },
  {
    name: 'play-money-portfolio',
    description: 'View open positions grouped by market with unrealized P&L',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-portfolio',
  },
  {
    name: 'play-money-check-balance',
    description: 'Show current currency balance and daily quest status',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-check-balance',
  },
  {
    name: 'play-money-create-market',
    description: 'Interactively scaffold and submit a new prediction market',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-create-market',
  },
  {
    name: 'play-money-resolve-market',
    description: 'Resolve or cancel a market with a supporting link',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-resolve-market',
  },
  {
    name: 'play-money-add-liquidity',
    description: 'Deposit liquidity into a market',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-add-liquidity',
  },
  {
    name: 'play-money-leaderboard',
    description: 'Fetch and display the monthly leaderboard',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-leaderboard',
  },
  {
    name: 'play-money-activity-feed',
    description: 'Stream recent site-wide or per-market activity and summarize trends',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-activity-feed',
  },
  {
    name: 'play-money-suggest-markets',
    description: 'Propose well-formed prediction market questions for a given topic',
    version: '1.0.0',
    downloadUrl: '/api/v1/claude-skills/play-money-suggest-markets',
  },
]

export async function GET(_req: Request): Promise<SchemaResponse<typeof schema.get.responses>> {
  return NextResponse.json({ data: SKILLS })
}
