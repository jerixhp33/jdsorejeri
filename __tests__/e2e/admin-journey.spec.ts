import { test, expect } from '@playwright/test';

test.describe('Admin Journey', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display login page elements properly', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
