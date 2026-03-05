#!/usr/bin/env node

import { Command } from 'commander'
import { installSkills } from './install'
import { uninstallSkills } from './uninstall'

const program = new Command()

program
  .name('play-money')
  .description('CLI for installing Claude Code skills for the Play Money prediction market platform')
  .version('1.0.0')

program
  .command('install-claude-skills')
  .description('Install Claude Code skills for interacting with Play Money')
  .requiredOption('--api-key <key>', 'Your Play Money API key')
  .option('--base-url <url>', 'Play Money API base URL', 'https://play.money')
  .option('--update', 'Only update skills that have changed', false)
  .action(async (options: { apiKey: string; baseUrl: string; update: boolean }) => {
    try {
      await installSkills(options)
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

program
  .command('uninstall-claude-skills')
  .description('Remove installed Claude Code skills for Play Money')
  .action(async () => {
    try {
      await uninstallSkills()
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

program.parse()
