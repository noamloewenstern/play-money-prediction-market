import fs from 'fs'
import os from 'os'
import path from 'path'

export async function listSkills(): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude')
  const settingsFile = path.join(claudeDir, 'settings.json')
  const skillsDir = path.join(claudeDir, 'skills', 'play-money')

  if (!fs.existsSync(settingsFile)) {
    console.log('No Claude Code settings found. Run install-claude-skills first.')
    return
  }

  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
  const skills = Array.isArray(settings.skills)
    ? settings.skills.filter((s: { path?: string }) => s.path?.includes('play-money/'))
    : []

  if (skills.length === 0) {
    console.log('No Play Money skills installed.')
    console.log('Run: npx play-money@latest install-claude-skills --api-key <key>')
    return
  }

  console.log(`\nInstalled Play Money Skills (${skills.length})`)
  console.log('=' .repeat(40) + '\n')

  for (const skill of skills) {
    const name = skill.name || path.basename(skill.path, '.md')
    const desc = skill.description || ''
    const exists = fs.existsSync(skill.path)
    const status = exists ? '' : ' [file missing]'
    console.log(`  ${name}${status}`)
    if (desc) {
      console.log(`    ${desc}`)
    }
  }

  console.log(`\nSkills directory: ${skillsDir}`)
}
