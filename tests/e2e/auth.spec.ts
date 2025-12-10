import { test, expect } from '../support/fixtures';

/**
 * Authentication Tests (P0)
 * Risk: R-001 - Unauthorized access to admin routes
 *
 * Tests authentication flows and route protection.
 */
test.describe('Authentication - P0', () => {
  test.describe('Login Flow', () => {
    test('should redirect authenticated user to admin dashboard', async ({ page }) => {
      // Given: User is authenticated (via setup)
      // When: User navigates to admin
      await page.goto('/admin');

      // Then: Admin dashboard should load
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display admin navigation after login', async ({ page }) => {
      // Given: User is authenticated
      await page.goto('/admin');

      // Then: Navigation elements should be visible
      // Check for sidebar or nav elements
      const hasNav = await page.locator('nav, [role="navigation"], aside').first().isVisible();
      expect(hasNav).toBeTruthy();
    });

    test('should allow navigation between admin sections', async ({ page }) => {
      // Given: User is on admin dashboard
      await page.goto('/admin');

      // When: User navigates to properties
      await page.goto('/admin/properties');
      await expect(page).toHaveURL(/\/admin\/properties/);

      // When: User navigates to clients
      await page.goto('/admin/clients');
      await expect(page).toHaveURL(/\/admin\/clients/);

      // When: User navigates to invoices
      await page.goto('/admin/invoices');
      await expect(page).toHaveURL(/\/admin\/invoices/);

      // When: User navigates to quotes
      await page.goto('/admin/quotes');
      await expect(page).toHaveURL(/\/admin\/quotes/);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Given: User is authenticated
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/admin/);

      // When: Page is refreshed
      await page.reload();

      // Then: User should still be on admin (not redirected to login)
      await expect(page).toHaveURL(/\/admin/);
    });
  });
});
