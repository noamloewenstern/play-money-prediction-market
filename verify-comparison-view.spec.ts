import { test, expect } from '@playwright/test'

const MULTI_OPTION_MARKET_URL =
  '/questions/cmmej01ji0000115wuytn771e/which-programming-language-will-be-most-popular'

test.describe('Market Comparison View for 3+ Options', () => {
  test('shows compare view by default for multi-option markets', async ({ page }) => {
    await page.goto(MULTI_OPTION_MARKET_URL)

    // The Compare button should be active (visible and styled as active)
    const compareBtn = page.locator('button', { hasText: 'Compare' })
    await expect(compareBtn).toBeVisible({ timeout: 15000 })

    // The List button should also be visible
    const listBtn = page.locator('button', { hasText: 'List' })
    await expect(listBtn).toBeVisible()

    // The comparison view container should be visible
    const comparisonView = page.getByTestId('comparison-view')
    await expect(comparisonView).toBeVisible({ timeout: 10000 })

    // Each option should appear as a bar inside the comparison view
    for (const name of ['Python', 'JavaScript', 'Rust', 'Go', 'TypeScript']) {
      await expect(comparisonView.locator('button', { hasText: name })).toBeVisible()
    }

    // Each option should show a percentage (tabular-nums spans inside comparison view)
    const percentages = comparisonView.locator('span.tabular-nums')
    const count = await percentages.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('can toggle between Compare and List views', async ({ page }) => {
    await page.goto(MULTI_OPTION_MARKET_URL)

    // Wait for the Compare button to appear
    const compareBtn = page.locator('button', { hasText: 'Compare' })
    await expect(compareBtn).toBeVisible({ timeout: 15000 })

    // Initially in Compare mode - comparison view should be visible
    const comparisonView = page.getByTestId('comparison-view')
    await expect(comparisonView).toBeVisible({ timeout: 10000 })

    // Switch to List view
    const listBtn = page.locator('button', { hasText: 'List' })
    await listBtn.click()

    // Comparison view should be gone
    await expect(comparisonView).not.toBeVisible({ timeout: 5000 })

    // In List view, should see checkbox elements (from MarketOptionRow)
    const checkboxes = page.locator('[role="checkbox"]')
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 })
    const checkboxCount = await checkboxes.count()
    expect(checkboxCount).toBeGreaterThanOrEqual(5)

    // Switch back to Compare view
    await compareBtn.click()
    await expect(comparisonView).toBeVisible({ timeout: 5000 })
  })

  test('clicking a bar selects the option for trading', async ({ page }) => {
    await page.goto(MULTI_OPTION_MARKET_URL)

    // Wait for comparison view
    const comparisonView = page.getByTestId('comparison-view')
    await expect(comparisonView).toBeVisible({ timeout: 15000 })

    // Click on the "Rust" option bar within comparison view
    const rustButton = comparisonView.locator('button', { hasText: 'Rust' })
    await expect(rustButton).toBeVisible({ timeout: 10000 })
    await rustButton.click()

    // After clicking, the URL should include selected= parameter
    await page.waitForTimeout(500)
    const url = page.url()
    expect(url).toContain('selected=')

    // The clicked option should have the active style (ring-1 ring-border)
    await expect(rustButton).toHaveClass(/ring-1/)
  })

  test('binary markets do not show compare/list toggle', async ({ page }) => {
    // Navigate directly to a known binary market
    await page.goto('/questions/cmme62bva043x6y0us0bd11g5/will-acidus-ratione-pectus-curtus-alo')
    await page.waitForTimeout(2000)

    // Binary markets should NOT have the comparison view or toggle
    const comparisonView = page.getByTestId('comparison-view')
    await expect(comparisonView).not.toBeVisible({ timeout: 3000 })

    // The Compare button should not exist
    const compareBtn = page.locator('button', { hasText: 'Compare' })
    await expect(compareBtn).not.toBeVisible({ timeout: 3000 })
  })
})
