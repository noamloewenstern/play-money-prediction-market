import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'verify-comparison-view.spec.ts',
  timeout: 90000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
})
