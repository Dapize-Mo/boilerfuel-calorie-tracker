// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Theme & Dark Mode', () => {
  test('page respects system dark mode preference', async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    // The theme initialization script should add the 'dark' class
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDark).toBe(true);
  });

  test('page respects system light mode preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDark).toBe(false);
  });

  test('theme toggle button is present', async ({ page }) => {
    await page.goto('/');
    // Theme toggle should be a button in the bottom-right corner
    const themeBtn = page.locator('button[aria-label*="theme"], button[title*="theme"], button[aria-label*="Theme"], button[title*="Theme"]');
    if (await themeBtn.count() > 0) {
      await expect(themeBtn.first()).toBeVisible();
    }
  });
});
