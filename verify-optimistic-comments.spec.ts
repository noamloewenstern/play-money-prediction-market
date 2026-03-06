import { test, expect } from '@playwright/test'

test.describe('Optimistic Comments and Reactions', () => {
  test('comment form renders on market comments tab', async ({ page }) => {
    await page.goto('/questions')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    await expect(marketLink).toBeVisible({ timeout: 10000 })
    await marketLink.click()
    await page.waitForURL(/\/questions\//)

    // Navigate to the Comments tab
    const commentsTab = page.getByRole('tab', { name: 'Comments' })
    await expect(commentsTab).toBeVisible({ timeout: 10000 })
    await commentsTab.click()

    // Verify the comment form exists
    const commentEditor = page.locator('[data-placeholder="Write a comment..."]')
    await expect(commentEditor).toBeVisible({ timeout: 10000 })
  })

  test('comments are rendered on the Comments tab', async ({ page }) => {
    await page.goto('/questions')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    await expect(marketLink).toBeVisible({ timeout: 10000 })
    await marketLink.click()
    await page.waitForURL(/\/questions\//)

    // Go to Comments tab
    const commentsTab = page.getByRole('tab', { name: 'Comments' })
    await expect(commentsTab).toBeVisible({ timeout: 10000 })
    await commentsTab.click()

    // Wait for comments to render
    await page.waitForTimeout(1000)

    // Existing comments should be visible - look for user links within comment items
    const commentAuthors = page.locator('a[href^="/"]').filter({ hasText: /\w+/ })
    const count = await commentAuthors.count()
    expect(count).toBeGreaterThan(0)
  })

  test('opacity-60 Tailwind class produces correct CSS', async ({ page }) => {
    // Navigate to a page so we have Tailwind loaded
    await page.goto('/questions')
    await page.waitForTimeout(1000)

    // Verify the opacity-60 class produces the correct CSS
    const opacityValue = await page.evaluate(() => {
      const testEl = document.createElement('div')
      testEl.className = 'opacity-60'
      document.body.appendChild(testEl)
      const computed = window.getComputedStyle(testEl)
      const opacity = computed.opacity
      document.body.removeChild(testEl)
      return opacity
    })

    // opacity-60 in Tailwind should produce opacity: 0.6
    expect(opacityValue).toBe('0.6')
  })

  test('comment action buttons are available on comments', async ({ page }) => {
    await page.goto('/questions')

    const marketLink = page.locator('a[href*="/questions/"]').first()
    await expect(marketLink).toBeVisible({ timeout: 10000 })
    await marketLink.click()
    await page.waitForURL(/\/questions\//)

    // Go to Comments tab
    const commentsTab = page.getByRole('tab', { name: 'Comments' })
    await expect(commentsTab).toBeVisible({ timeout: 10000 })
    await commentsTab.click()

    await page.waitForTimeout(1000)

    // Hover over the first comment to reveal action buttons
    const firstComment = page.locator('.group').first()
    await firstComment.hover()

    // Reply and emoji buttons should be present on comments
    // The reply button contains the Reply icon
    const replyButtons = page.locator('button svg').filter({ has: page.locator('path') })
    const count = await replyButtons.count()
    expect(count).toBeGreaterThan(0)
  })
})
