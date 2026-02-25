// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BoilerFuel/);
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About.*BoilerFuel/);
    await expect(page.locator('text=BoilerFuel')).toBeVisible();
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=Export Data')).toBeVisible();
  });

  test('nav links work correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/\/about/);
    await page.click('a[href="/"]');
    await expect(page).toHaveURL(/\/$/);
  });

  test('profile link in nav', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/profile"]');
    await expect(page).toHaveURL(/\/profile/);
  });
});
