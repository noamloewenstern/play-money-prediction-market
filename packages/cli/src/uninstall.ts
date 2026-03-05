import fs from 'fs'
import os from 'os'
import path from 'path'

export async function uninstallSkills(): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude')
  const skillsDir = path.join(claudeDir, 'skills', 'play-money')
  const settingsFile = path.join(claudeDir, 'settings.json')
  const envFile = path.join(claudeDir, '.env')

  // Remove skill files
  if (fs.existsSync(skillsDir)) {
    const files = fs.readdirSync(skillsDir)
    for (const file of files) {
      fs.unlinkSync(path.join(skillsDir, file))
      console.log(`  Removed: ${file}`)
    }
    fs.rmdirSync(skillsDir)
    console.log(`Removed skills directory: ${skillsDir}`)
  } else {
    console.log('No Play Money skills found to remove.')
  }

  // Remove from settings.json
  if (fs.existsSync(settingsFile)) {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
    if (Array.isArray(settings.skills)) {
      const before = settings.skills.length
      settings.skills = settings.skills.filter(
        (s: { path?: string }) => !s.path?.includes('play-money/')
      )
      const removed = before - settings.skills.length
      if (removed > 0) {
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
        console.log(`Removed ${removed} skill entries from settings.json`)
      }
    }
  }

  // Remove env vars
  if (fs.existsSync(envFile)) {
    let envContent = fs.readFileSync(envFile, 'utf-8')
    const hadKey = envContent.includes('PLAY_MONEY_API_KEY=')
    envContent = envContent.replace(/PLAY_MONEY_API_KEY=.*\n?/g, '')
    envContent = envContent.replace(/PLAY_MONEY_BASE_URL=.*\n?/g, '')
    if (hadKey) {
      fs.writeFileSync(envFile, envContent, 'utf-8')
      console.log('Removed Play Money environment variables from .env')
    }
  }

  console.log('\nPlay Money Claude Code skills have been uninstalled.')
}
