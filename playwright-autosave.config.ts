import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'verify-autosave.spec.ts',
  timeout: 90000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
})
