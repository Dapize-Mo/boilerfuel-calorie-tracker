// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Meal Tracking', () => {
  test('home page shows dining location selector', async ({ page }) => {
    await page.goto('/');
    // Should have a location dropdown or selector
    await expect(page.locator('text=All').first()).toBeVisible();
  });

  test('profile page shows daily totals section', async ({ page }) => {
    await page.goto('/profile');
    // Should show calories/macros section
    await expect(page.locator('text=Calories').first()).toBeVisible();
  });

  test('export buttons are present on profile page', async ({ page }) => {
    await page.goto('/profile');
    const exportSection = page.locator('text=Export Data');
    await expect(exportSection).toBeVisible();

    // Check all export buttons are present
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible();
    await expect(page.locator('button:has-text("Cronometer")')).toBeVisible();
    await expect(page.locator('button:has-text("GData")')).toBeVisible();
    await expect(page.locator('button:has-text("Apple Health")')).toBeVisible();
    await expect(page.locator('button:has-text("PDF")')).toBeVisible();
  });

  test('goal editing can be toggled', async ({ page }) => {
    await page.goto('/profile');
    const editBtn = page.locator('button:has-text("Edit Goals")');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      // Should show save/cancel buttons
      await expect(page.locator('button:has-text("Save")').first()).toBeVisible();
    }
  });
});
