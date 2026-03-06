import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'
import type { SchemaResponse } from '@play-money/api-helpers'
import schema from './schema'

export const dynamic = 'force-dynamic'

const SKILLS_DIR = path.join(process.cwd(), 'skills')

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

const hashCache = new Map<string, string>()

async function computeSha256(skillName: string): Promise<string> {
  const cached = hashCache.get(skillName)
  if (cached) return cached

  const filePath = path.join(SKILLS_DIR, `${skillName}.md`)
  const content = await readFile(filePath, 'utf-8')
  const hash = createHash('sha256').update(content).digest('hex')
  hashCache.set(skillName, hash)
  return hash
}

export async function GET(_req: Request): Promise<SchemaResponse<typeof schema.get.responses>> {
  const skillsWithHash = await Promise.all(
    SKILLS.map(async (skill) => ({
      ...skill,
      sha256: await computeSha256(skill.name),
    }))
  )
  return NextResponse.json({ data: skillsWithHash })
}
