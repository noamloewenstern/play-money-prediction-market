import { test, expect } from '@playwright/test'

test.describe('Sticky Trade Panel', () => {
  test('desktop: sidebar trade panel stays visible when scrolling', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })

    // Navigate to the questions listing to find a market
    await page.goto('/questions')
    await page.waitForLoadState('networkidle')

    // Click on the first market link
    const firstMarketLink = page.locator('a[href*="/questions/"]').first()
    await firstMarketLink.click()
    await page.waitForLoadState('networkidle')

    // Check that the trade panel sidebar exists and is visible
    const sidebar = page.locator('.sticky.top-\\[72px\\]')
    await expect(sidebar).toBeVisible()

    // Scroll down the page significantly
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(500)

    // The sidebar should still be visible (sticky)
    await expect(sidebar).toBeVisible()

    // The trade panel card (Buy/Sell tabs) should be in the viewport
    const tradePanelCard = sidebar.locator('[role="tablist"]').first()
    if (await tradePanelCard.count() > 0) {
      const box = await tradePanelCard.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        // Should still be in the viewport after scrolling
        expect(box.y).toBeGreaterThanOrEqual(0)
        expect(box.y).toBeLessThan(720)
      }
    }
  })

  test('mobile: trade bar is visible and opens sheet on tap', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to the questions listing to find a market
    await page.goto('/questions')
    await page.waitForLoadState('networkidle')

    // Click on the first market link
    const firstMarketLink = page.locator('a[href*="/questions/"]').first()
    await firstMarketLink.click()
    await page.waitForLoadState('networkidle')

    // The desktop sidebar should be hidden on mobile
    const desktopSidebar = page.locator('.hidden.md\\:block')
    await expect(desktopSidebar).toBeHidden()

    // The mobile trade bar should be visible at the bottom
    const mobileBar = page.locator('.fixed.bottom-0.md\\:hidden')
    await expect(mobileBar).toBeVisible()

    // It should have a Trade button (or View Result/View depending on market state)
    const tradeButton = mobileBar.locator('button')
    await expect(tradeButton).toBeVisible()

    // Click the trade button to open the sheet
    await tradeButton.click()
    await page.waitForTimeout(500)

    // The sheet should be open with the trade panel content
    const sheetContent = page.locator('[role="dialog"]')
    await expect(sheetContent).toBeVisible()
  })
})
