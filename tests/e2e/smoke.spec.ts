import { test, expect } from '../support/fixtures';

/**
 * Smoke Tests - Critical Path Validation
 *
 * These tests verify the most critical user journeys work.
 * Run these first before detailed feature tests.
 */
test.describe('Smoke Tests', () => {
  test('should load admin dashboard', async ({ page }) => {
    // Given: User is authenticated (via setup)
    // When: User navigates to admin
    await page.goto('/admin');

    // Then: Dashboard should load
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display properties list', async ({ page }) => {
    // Given: User is on admin dashboard
    await page.goto('/admin/properties');

    // Then: Properties page should load
    await expect(page).toHaveURL(/\/admin\/properties/);
  });

  test('should display clients list', async ({ page }) => {
    // Given: User is on admin dashboard
    await page.goto('/admin/clients');

    // Then: Clients page should load
    await expect(page).toHaveURL(/\/admin\/clients/);
  });

  test('should display invoices list', async ({ page }) => {
    // Given: User is on admin dashboard
    await page.goto('/admin/invoices');

    // Then: Invoices page should load
    await expect(page).toHaveURL(/\/admin\/invoices/);
  });

  test('should display quotes list', async ({ page }) => {
    // Given: User is on admin dashboard
    await page.goto('/admin/quotes');

    // Then: Quotes page should load
    await expect(page).toHaveURL(/\/admin\/quotes/);
  });
});
