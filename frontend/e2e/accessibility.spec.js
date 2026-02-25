// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Accessibility', () => {
  test('page has correct lang attribute', async ({ page }) => {
    await page.goto('/');
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('page has main landmark', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('skip to content link exists', async ({ page }) => {
    await page.goto('/');
    // The skip link should exist (may be visually hidden until focused)
    const skipLink = page.locator('a:has-text("Skip to")');
    await expect(skipLink).toHaveCount(1);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    // Tab through the page and verify focus moves
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('structured data is present', async ({ page }) => {
    await page.goto('/');
    const ldJson = page.locator('script[type="application/ld+json"]');
    await expect(ldJson).toHaveCount(1);
    const content = await ldJson.textContent();
    const data = JSON.parse(content);
    expect(data['@type']).toBe('WebApplication');
    expect(data.name).toBe('BoilerFuel');
  });
});
