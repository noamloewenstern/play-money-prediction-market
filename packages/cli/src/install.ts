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
}

type InstallOptions = {
  apiKey: string
  baseUrl: string
  update: boolean
}

function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetch(res.headers.location).then(resolve, reject)
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

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readJsonFile(filePath: string): Record<string, unknown> {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
  return {}
}

function writeJsonFile(filePath: string, data: Record<string, unknown>): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

export async function installSkills(options: InstallOptions): Promise<void> {
  const { apiKey, baseUrl, update } = options
  const claudeDir = path.join(os.homedir(), '.claude')
  const skillsDir = path.join(claudeDir, 'skills', 'play-money')
  const envFile = path.join(claudeDir, '.env')
  const settingsFile = path.join(claudeDir, 'settings.json')

  console.log('Fetching skill manifest...')
  const manifestUrl = `${baseUrl}/api/v1/claude-skills/manifest`
  const manifestJson = await fetch(manifestUrl)
  const { data: skills } = JSON.parse(manifestJson) as { data: Array<ManifestEntry> }
  console.log(`Found ${skills.length} skills`)

  // Download skill files
  ensureDir(skillsDir)
  let installed = 0
  let skipped = 0

  for (const skill of skills) {
    const filePath = path.join(skillsDir, `${skill.name}.md`)

    if (update && fs.existsSync(filePath)) {
      // Check version by reading frontmatter or just re-download
      const existing = fs.readFileSync(filePath, 'utf-8')
      const downloadUrl = `${baseUrl}${skill.downloadUrl}`
      const content = await fetch(downloadUrl)
      if (existing === content) {
        skipped++
        continue
      }
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`  Updated: ${skill.name} (v${skill.version})`)
      installed++
    } else {
      const downloadUrl = `${baseUrl}${skill.downloadUrl}`
      const content = await fetch(downloadUrl)
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`  Installed: ${skill.name} (v${skill.version})`)
      installed++
    }
  }

  // Register skills in settings.json
  console.log('\nRegistering skills in Claude Code settings...')
  const settings = readJsonFile(settingsFile) as Record<string, unknown>
  const existingSkills = (settings.skills ?? []) as Array<{ path: string; name?: string }>
  const playMoneySkillPaths = skills.map((s) => path.join(skillsDir, `${s.name}.md`))

  // Remove old play-money skills, add current ones
  const otherSkills = existingSkills.filter(
    (s) => !s.path.includes('play-money/')
  )
  const newSkills = skills.map((s) => ({
    path: path.join(skillsDir, `${s.name}.md`),
    name: s.name,
    description: s.description,
  }))
  settings.skills = [...otherSkills, ...newSkills]
  writeJsonFile(settingsFile, settings)

  // Persist env vars
  console.log('Saving API configuration...')
  let envContent = ''
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf-8')
  }

  // Update or append PLAY_MONEY_API_KEY
  if (envContent.includes('PLAY_MONEY_API_KEY=')) {
    envContent = envContent.replace(/PLAY_MONEY_API_KEY=.*/g, `PLAY_MONEY_API_KEY=${apiKey}`)
  } else {
    envContent += `${envContent && !envContent.endsWith('\n') ? '\n' : ''}PLAY_MONEY_API_KEY=${apiKey}\n`
  }

  // Update or append PLAY_MONEY_BASE_URL
  if (envContent.includes('PLAY_MONEY_BASE_URL=')) {
    envContent = envContent.replace(/PLAY_MONEY_BASE_URL=.*/g, `PLAY_MONEY_BASE_URL=${baseUrl}`)
  } else {
    envContent += `PLAY_MONEY_BASE_URL=${baseUrl}\n`
  }

  ensureDir(path.dirname(envFile))
  fs.writeFileSync(envFile, envContent, 'utf-8')

  // Track install on server (best effort)
  try {
    const trackUrl = `${baseUrl}/api/v1/claude-skills/install`
    const postData = JSON.stringify({ skills: skills.map((s) => s.name), cliVersion: '1.0.0' })
    await new Promise<void>((resolve) => {
      const client = trackUrl.startsWith('https') ? https : http
      const urlObj = new URL(trackUrl)
      const req = client.request(
        { hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }, timeout: 5000 },
        () => resolve()
      )
      req.on('error', () => resolve())
      req.on('timeout', () => { req.destroy(); resolve() })
      req.write(postData)
      req.end()
    })
  } catch {
    // Ignore tracking errors
  }

  // Summary
  console.log('\n---')
  console.log(`Installed ${installed} skills${skipped > 0 ? ` (${skipped} unchanged)` : ''}`)
  console.log(`Skills directory: ${skillsDir}`)
  console.log(`Settings updated: ${settingsFile}`)
  console.log(`API key saved to: ${envFile}`)
  console.log('\nTry it out! Say to Claude Code:')
  console.log('  "browse prediction markets about AI"')
  console.log('  "check my Play Money balance"')
  console.log('  "search for markets about technology"')
}
