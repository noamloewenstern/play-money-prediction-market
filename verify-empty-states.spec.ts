import { test, expect } from '@playwright/test'

test.describe('Empty States', () => {
  test('bookmarks page shows empty state for logged-out users', async ({ page }) => {
    await page.goto('/questions/bookmarks')

    // Should show sign-in empty state with illustration
    await expect(page.locator('text=Sign in to bookmark markets')).toBeVisible()
    await expect(page.locator('text=Sign In')).toBeVisible()
    // Check that the icon circle is present (primary/10 background)
    const iconCircle = page.locator('.rounded-full.bg-primary\\/10').first()
    await expect(iconCircle).toBeVisible()
  })

  test('search shows empty state with illustration', async ({ page }) => {
    await page.goto('/')

    // Open search with keyboard shortcut
    await page.keyboard.press('Meta+k')

    // Wait for dialog to open
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Type a query that won't match anything
    await page.keyboard.type('xyznonexistentquery12345')

    // Wait for the "No results" message
    await expect(page.locator('text=No results for')).toBeVisible({ timeout: 10000 })

    // Check that the icon circle is present
    const iconCircle = dialog.locator('.rounded-full.bg-primary\\/10').first()
    await expect(iconCircle).toBeVisible()
  })

  test('market empty state shows illustration', async ({ page }) => {
    // Navigate to a tagged page that likely has no results
    await page.goto('/questions/tagged/xyznonexistenttag12345')

    // Should show the empty state
    await expect(page.locator('text=No markets found')).toBeVisible({ timeout: 10000 })

    // Check for the primary icon illustration
    const iconCircle = page.locator('.rounded-full.bg-primary\\/10').first()
    await expect(iconCircle).toBeVisible()

    // Check for CTA button
    await expect(page.locator('text=Create a market')).toBeVisible()
  })
})
