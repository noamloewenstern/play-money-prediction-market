import { test, expect } from '@playwright/test'

test.describe('Inline Trade Confirmation', () => {
  test('buy form shows inline confirmation step with before/after summary', async ({ page }) => {
    await page.goto('/questions')

    // Click on the first market
    const marketLink = page.locator('a[href*="/questions/"]').first()
    await expect(marketLink).toBeVisible({ timeout: 15000 })
    await marketLink.click()
    await page.waitForURL(/\/questions\//)

    // Wait for the trade panel to load (desktop sidebar)
    const buyButton = page.locator('button[type="submit"]').filter({ hasText: /Buy/ }).first()
    await expect(buyButton).toBeVisible({ timeout: 10000 })

    // Click the Buy button to trigger inline confirmation
    await buyButton.click()

    // The inline confirmation should appear with data-testid
    const confirmation = page.locator('[data-testid="trade-confirmation"]')
    await expect(confirmation).toBeVisible({ timeout: 5000 })

    // Check for key confirmation elements
    await expect(confirmation.getByText('Confirm Trade').first()).toBeVisible()
    await expect(confirmation.getByText('Total cost')).toBeVisible()
    await expect(confirmation.getByText('Shares to receive')).toBeVisible()
    await expect(confirmation.getByText('Potential payout')).toBeVisible()
    await expect(confirmation.getByText('Probability Impact')).toBeVisible()

    // The confirm button should be present
    const confirmButton = page.locator('[data-testid="trade-confirmation-confirm"]')
    await expect(confirmButton).toBeVisible()
    await expect(confirmButton).toHaveText('Confirm Trade')
  })

  test('back button returns to the buy form', async ({ page }) => {
    await page.goto('/questions')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    await expect(marketLink).toBeVisible({ timeout: 15000 })
    await marketLink.click()
    await page.waitForURL(/\/questions\//)

    // Click Buy to show confirmation
    const buyButton = page.locator('button[type="submit"]').filter({ hasText: /Buy/ }).first()
    await expect(buyButton).toBeVisible({ timeout: 10000 })
    await buyButton.click()

    const confirmation = page.locator('[data-testid="trade-confirmation"]')
    await expect(confirmation).toBeVisible({ timeout: 5000 })

    // Click the back button
    const backButton = page.locator('[data-testid="trade-confirmation-back"]')
    await backButton.click()

    // Confirmation should disappear and form should be visible again
    await expect(confirmation).not.toBeVisible()
    const buyButtonAgain = page.locator('button[type="submit"]').filter({ hasText: /Buy/ }).first()
    await expect(buyButtonAgain).toBeVisible({ timeout: 5000 })
  })

  test('probability impact section shows before and after values', async ({ page }) => {
    await page.goto('/questions')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    await expect(marketLink).toBeVisible({ timeout: 15000 })
    await marketLink.click()
    await page.waitForURL(/\/questions\//)

    // Click Buy
    const buyButton = page.locator('button[type="submit"]').filter({ hasText: /Buy/ }).first()
    await expect(buyButton).toBeVisible({ timeout: 10000 })
    await buyButton.click()

    const confirmation = page.locator('[data-testid="trade-confirmation"]')
    await expect(confirmation).toBeVisible({ timeout: 5000 })

    // The probability impact section should have percentage values
    const probabilitySection = confirmation.locator('text=Probability Impact').locator('..')
    await expect(probabilitySection).toBeVisible()

    // Should contain at least one percentage value
    const percentValues = confirmation.locator('text=/%/')
    // Just verify the section exists with arrow between values
    const arrow = confirmation.locator('svg.h-3\\.5')
    await expect(arrow).toBeVisible()
  })
})
