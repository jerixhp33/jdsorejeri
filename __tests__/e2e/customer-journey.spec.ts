import { test, expect } from '@playwright/test';

test.describe('Customer Journey', () => {
  test('should navigate to the homepage and view best sellers', async ({ page }) => {
    await page.goto('/');
    
    // Expect the title to contain JD Store
    await expect(page).toHaveTitle(/JD Store/);
    
    // Check if Best Sellers section exists
    const bestSellersLink = page.getByRole('link', { name: /best sellers/i }).first();
    if (await bestSellersLink.isVisible()) {
      await bestSellersLink.click();
      await expect(page).toHaveURL(/.*best-sellers/);
    }
  });

  test('should allow browsing product categories', async ({ page }) => {
    await page.goto('/');
    
    const collectionsLink = page.getByRole('link', { name: /collections/i }).first();
    await collectionsLink.click();
    await expect(page).toHaveURL(/.*collections/);
    
    // Since the database might be empty in a test run, we just check for basic layout
    await expect(page.getByRole('heading', { name: /Collections/i })).toBeVisible();
  });
});
