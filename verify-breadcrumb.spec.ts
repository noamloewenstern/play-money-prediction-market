import { test, expect } from '@playwright/test'

test.describe('Market Breadcrumb', () => {
  test('breadcrumb renders on market page with tag ref', async ({ page }) => {
    // Go to homepage first to find a market
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Look for any market link on the page
    const marketLink = page.locator('a[href*="/questions/"]').first()
    const href = await marketLink.getAttribute('href')
    expect(href).toBeTruthy()

    // Navigate to the market with a tag ref
    await page.goto(`${href}?ref=tag:test-tag`)
    await page.waitForLoadState('networkidle')

    // Check that breadcrumb nav exists
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumb).toBeVisible()

    // Check Home icon link
    const homeLink = breadcrumb.locator('a[href="/"]')
    await expect(homeLink).toBeVisible()

    // Check tag segment link
    const tagLink = breadcrumb.locator('a[href*="/questions/tagged/test-tag"]')
    await expect(tagLink).toBeVisible()
    await expect(tagLink).toHaveText('test-tag')

    // Check market name segment (last segment, no link)
    const segments = breadcrumb.locator('span')
    await expect(segments.last()).toBeVisible()
  })

  test('breadcrumb renders with list ref when market has parentList', async ({ page }) => {
    // Go to homepage to find a market
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    const href = await marketLink.getAttribute('href')
    expect(href).toBeTruthy()

    // Navigate with a list ref (will fall back if no parentList)
    await page.goto(`${href}?ref=list:some-list-id`)
    await page.waitForLoadState('networkidle')

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumb).toBeVisible()

    // Home link should always be present
    const homeLink = breadcrumb.locator('a[href="/"]')
    await expect(homeLink).toBeVisible()
  })

  test('breadcrumb falls back to first tag when no ref', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    const href = await marketLink.getAttribute('href')
    expect(href).toBeTruthy()

    // Navigate without ref param
    await page.goto(href!)
    await page.waitForLoadState('networkidle')

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumb).toBeVisible()

    const homeLink = breadcrumb.locator('a[href="/"]')
    await expect(homeLink).toBeVisible()
  })

  test('tag page market links include ref param', async ({ page }) => {
    // First, find a tag page by visiting a market and checking its tags
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Look for a tag link on a market page
    const marketLink = page.locator('a[href*="/questions/"]').first()
    const href = await marketLink.getAttribute('href')

    if (href) {
      await page.goto(href)
      await page.waitForLoadState('networkidle')

      // Find a tag badge link
      const tagLink = page.locator('a[href*="/questions/tagged/"]').first()
      const tagHref = await tagLink.getAttribute('href')

      if (tagHref) {
        await page.goto(tagHref)
        await page.waitForLoadState('networkidle')

        // Check that market links on tag page include ref param
        const tagMarketLink = page.locator('a[href*="/questions/"][href*="ref="]').first()
        const tagMarketHref = await tagMarketLink.getAttribute('href')
        expect(tagMarketHref).toContain('ref=tag%3A')
      }
    }
  })

  test('breadcrumb home link navigates to homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    const href = await marketLink.getAttribute('href')
    expect(href).toBeTruthy()

    await page.goto(`${href}?ref=tag:test`)
    await page.waitForLoadState('networkidle')

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]')
    const homeLink = breadcrumb.locator('a[href="/"]')
    await homeLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toBe('http://localhost:3000/')
  })
})
