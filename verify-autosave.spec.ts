import { test, expect } from '@playwright/test'

test.describe('Autosave Draft Recovery', () => {
  test.describe('Market Creation Form', () => {
    test('shows draft recovery banner when returning with saved draft', async ({ page }) => {
      // Navigate to the create-post page
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')

      // Set localStorage with a draft
      await page.evaluate(() => {
        const draft = JSON.stringify({
          question: 'Will AI surpass human intelligence by 2030?',
          type: 'binary',
          description: '<p>Test description</p>',
          resolutionCriteria: null,
          closeDate: new Date(Date.now() + 86400000 * 60).toISOString(),
          options: [
            { name: 'Yes', color: '#f44336' },
            { name: 'No', color: '#9c27b0' },
          ],
          contributionPolicy: 'OWNERS_ONLY',
          tags: [],
        })
        localStorage.setItem('create-market-form', draft)
      })

      // Verify localStorage was set
      const stored = await page.evaluate(() => localStorage.getItem('create-market-form'))
      expect(stored).not.toBeNull()

      // Navigate away and back (not just reload, to ensure fresh component mount)
      await page.goto('/questions')
      await page.waitForLoadState('networkidle')
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')

      // Check if localStorage still has our data
      const storedAfterNav = await page.evaluate(() => localStorage.getItem('create-market-form'))
      const parsed = JSON.parse(storedAfterNav!)
      expect(parsed.question).toBe('Will AI surpass human intelligence by 2030?')

      // Should show the draft recovery banner
      const banner = page.getByText('Unsaved draft found')
      await expect(banner).toBeVisible({ timeout: 10000 })

      // Should have Restore and Discard buttons
      await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Discard' })).toBeVisible()
    })

    test('discards draft when Discard is clicked', async ({ page }) => {
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')

      await page.evaluate(() => {
        const draft = JSON.stringify({
          question: 'Draft to discard',
          type: 'binary',
          description: '',
          resolutionCriteria: null,
          closeDate: new Date(Date.now() + 86400000 * 60).toISOString(),
          options: [
            { name: 'Yes', color: '#f44336' },
            { name: 'No', color: '#9c27b0' },
          ],
          contributionPolicy: 'OWNERS_ONLY',
          tags: [],
        })
        localStorage.setItem('create-market-form', draft)
      })

      // Navigate away and back
      await page.goto('/questions')
      await page.waitForLoadState('networkidle')
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')

      // Wait for draft banner
      await expect(page.getByText('Unsaved draft found')).toBeVisible({ timeout: 10000 })

      // Click Discard
      await page.getByRole('button', { name: 'Discard' }).click()

      // Banner should disappear
      await expect(page.getByText('Unsaved draft found')).not.toBeVisible()

      // localStorage should be cleared (or contain empty question)
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem('create-market-form')
        if (!raw) return null
        return JSON.parse(raw)
      })
      // After discard, usePersistForm may re-save fresh defaults (empty question)
      expect(!stored || !stored.question).toBeTruthy()
    })

    test('restores draft when Restore is clicked', async ({ page }) => {
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')

      await page.evaluate(() => {
        const draft = JSON.stringify({
          question: 'Restored question text',
          type: 'binary',
          description: '',
          resolutionCriteria: null,
          closeDate: new Date(Date.now() + 86400000 * 60).toISOString(),
          options: [
            { name: 'Yes', color: '#f44336' },
            { name: 'No', color: '#9c27b0' },
          ],
          contributionPolicy: 'OWNERS_ONLY',
          tags: [],
        })
        localStorage.setItem('create-market-form', draft)
      })

      // Navigate away and back
      await page.goto('/questions')
      await page.waitForLoadState('networkidle')
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')

      // Wait for draft banner
      await expect(page.getByText('Unsaved draft found')).toBeVisible({ timeout: 10000 })

      // Click Restore
      await page.getByRole('button', { name: 'Restore' }).click()

      // Banner should disappear
      await expect(page.getByText('Unsaved draft found')).not.toBeVisible()

      // The question field should still have the restored text
      const questionInput = page.locator('input[name="question"]')
      await expect(questionInput).toHaveValue('Restored question text')
    })

    test('autosaves form data to localStorage on input', async ({ page }) => {
      // Clear any existing draft
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => localStorage.removeItem('create-market-form'))

      // Navigate away and back (fresh mount with no draft)
      await page.goto('/questions')
      await page.waitForLoadState('networkidle')
      await page.goto('/create-post')
      await page.waitForLoadState('networkidle')

      // Type into the question field
      const questionInput = page.locator('input[name="question"]')
      await questionInput.waitFor({ timeout: 10000 })
      await questionInput.fill('New autosaved question')

      // Wait for the effect to fire
      await page.waitForTimeout(1000)

      // Check localStorage
      const stored = await page.evaluate(() => localStorage.getItem('create-market-form'))
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.question).toBe('New autosaved question')
    })
  })

  test.describe('Comment Editor', () => {
    test('saves comment draft to localStorage on typing', async ({ page }) => {
      // Navigate to any market page
      await page.goto('/questions')

      // Find and click the first market link
      const firstMarket = page.locator('a[href^="/questions/"]').first()
      await firstMarket.waitFor({ timeout: 10000 })
      await firstMarket.click()

      // Wait for the page to load
      await page.waitForLoadState('networkidle')

      // Look for comment editor
      const editor = page.locator('.tiptap[contenteditable="true"]').first()
      await editor.waitFor({ timeout: 10000 })

      // Type some content
      await editor.click()
      await editor.pressSequentially('This is a test comment draft', { delay: 30 })

      // Wait for autosave
      await page.waitForTimeout(500)

      // Check that something was saved to localStorage with the comment-draft- prefix
      const keys = await page.evaluate(() => {
        return Object.keys(localStorage).filter((k) => k.startsWith('comment-draft-'))
      })
      expect(keys.length).toBeGreaterThan(0)

      // The saved content should contain our text
      const savedContent = await page.evaluate((key) => localStorage.getItem(key), keys[0])
      expect(savedContent).toContain('This is a test comment draft')
    })
  })
})
