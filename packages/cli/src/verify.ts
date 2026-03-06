import { createHash } from 'crypto'
import fs from 'fs'
import https from 'https'
import http from 'http'
import os from 'os'
import path from 'path'

type ManifestEntry = {
  name: string
  description: string
  version: string
  downloadUrl: string
  sha256: string
}

type CheckResult = {
  label: string
  pass: boolean
  detail: string
}

function fetchJson(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve, reject)
        return
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} from ${url}`))
        return
      }
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

export async function verifySkills(options: { baseUrl?: string; online: boolean }): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude')
  const skillsDir = path.join(claudeDir, 'skills', 'play-money')
  const settingsFile = path.join(claudeDir, 'settings.json')
  const envFile = path.join(claudeDir, '.env')

  const checks: Array<CheckResult> = []

  // Check 1: Skills directory exists and has files
  if (fs.existsSync(skillsDir)) {
    const files = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'))
    checks.push({
      label: 'Skills directory',
      pass: files.length > 0,
      detail: files.length > 0 ? `${files.length} skills installed in ${skillsDir}` : `Directory exists but is empty: ${skillsDir}`,
    })
  } else {
    checks.push({
      label: 'Skills directory',
      pass: false,
      detail: `Not found: ${skillsDir}\n    Run: npx play-money@latest install-claude-skills --api-key <key>`,
    })
  }

  // Check 2: Settings.json has play-money skills
  if (fs.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
      const skills = Array.isArray(settings.skills)
        ? settings.skills.filter((s: { path?: string }) => s.path?.includes('play-money/'))
        : []
      checks.push({
        label: 'Claude settings',
        pass: skills.length > 0,
        detail: skills.length > 0
          ? `${skills.length} skills registered in settings.json`
          : 'No Play Money skills found in settings.json',
      })
    } catch {
      checks.push({
        label: 'Claude settings',
        pass: false,
        detail: 'Failed to parse settings.json',
      })
    }
  } else {
    checks.push({
      label: 'Claude settings',
      pass: false,
      detail: `Not found: ${settingsFile}`,
    })
  }

  // Check 3: Env vars
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8')
    const hasApiKey = envContent.includes('PLAY_MONEY_API_KEY=')
    const hasBaseUrl = envContent.includes('PLAY_MONEY_BASE_URL=')
    checks.push({
      label: 'API key (.env)',
      pass: hasApiKey,
      detail: hasApiKey ? 'PLAY_MONEY_API_KEY is set' : 'PLAY_MONEY_API_KEY not found in .env',
    })
    checks.push({
      label: 'Base URL (.env)',
      pass: hasBaseUrl,
      detail: hasBaseUrl ? 'PLAY_MONEY_BASE_URL is set' : 'PLAY_MONEY_BASE_URL not found in .env',
    })
  } else {
    checks.push({
      label: 'Environment file',
      pass: false,
      detail: `Not found: ${envFile}\n    Run the install command to configure API credentials.`,
    })
  }

  // Check 4 (online): Compare with manifest and verify checksums
  if (options.online) {
    const baseUrl = options.baseUrl || getBaseUrlFromEnv(envFile)
    if (baseUrl) {
      try {
        const manifestJson = await fetchJson(`${baseUrl}/api/v1/claude-skills/manifest`)
        const { data: remoteSkills } = JSON.parse(manifestJson) as { data: Array<ManifestEntry> }

        const localFiles = fs.existsSync(skillsDir)
          ? fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'))
          : []

        const missing = remoteSkills.filter(
          (s) => !localFiles.includes(`${s.name}.md`)
        )
        checks.push({
          label: 'Skill completeness',
          pass: missing.length === 0,
          detail: missing.length === 0
            ? `All ${remoteSkills.length} skills are installed`
            : `Missing ${missing.length} skills: ${missing.map((s) => s.name).join(', ')}`,
        })

        // Verify checksums of installed files
        let checksumPassed = 0
        let checksumFailed = 0
        for (const skill of remoteSkills) {
          const filePath = path.join(skillsDir, `${skill.name}.md`)
          if (!fs.existsSync(filePath)) continue
          const content = fs.readFileSync(filePath, 'utf-8')
          const localHash = createHash('sha256').update(content).digest('hex')
          if (localHash === skill.sha256) {
            checksumPassed++
          } else {
            checksumFailed++
          }
        }
        if (checksumPassed + checksumFailed > 0) {
          checks.push({
            label: 'Integrity (SHA256)',
            pass: checksumFailed === 0,
            detail: checksumFailed === 0
              ? `All ${checksumPassed} installed skills pass integrity check`
              : `${checksumFailed} skills have mismatched checksums (run install with --update to fix)`,
          })
        }
      } catch (err) {
        checks.push({
          label: 'Online verification',
          pass: false,
          detail: `Could not reach manifest: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
      }
    } else {
      checks.push({
        label: 'Online verification',
        pass: false,
        detail: 'No base URL available. Pass --base-url or set PLAY_MONEY_BASE_URL in .env',
      })
    }
  }

  // Print results
  console.log('\nPlay Money Claude Skills Health Check')
  console.log('=====================================\n')

  let allPassed = true
  for (const check of checks) {
    const icon = check.pass ? '\u2713' : '\u2717'
    console.log(`  ${icon} ${check.label}: ${check.detail}`)
    if (!check.pass) allPassed = false
  }

  console.log('')
  if (allPassed) {
    console.log('All checks passed!')
  } else {
    console.log('Some checks failed. See details above.')
    process.exit(1)
  }
}

function getBaseUrlFromEnv(envFile: string): string | null {
  if (!fs.existsSync(envFile)) return null
  const content = fs.readFileSync(envFile, 'utf-8')
  const match = content.match(/PLAY_MONEY_BASE_URL=(.+)/)
  return match ? match[1].trim() : null
}
