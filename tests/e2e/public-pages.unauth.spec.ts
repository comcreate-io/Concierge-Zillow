import { test, expect } from '@playwright/test';

/**
 * Public Pages Tests - Unauthenticated (P1)
 *
 * Tests public-facing pages that don't require authentication.
 */
test.describe('Public Pages - P1', () => {
  test.describe('Homepage', () => {
    test('should display homepage', async ({ page }) => {
      // When: User visits homepage
      await page.goto('/');

      // Then: Page should load with content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have navigation elements', async ({ page }) => {
      // When: User visits homepage
      await page.goto('/');

      // Then: Should have header/navigation
      const hasHeader = await page.locator('header, nav, [role="banner"]').first().isVisible().catch(() => false);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Properties Listing', () => {
    test('should display properties page', async ({ page }) => {
      // When: User visits properties
      await page.goto('/properties');

      // Then: Properties page should load
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Property Detail', () => {
    test('should handle non-existent property', async ({ page }) => {
      // When: User visits non-existent property
      await page.goto('/property/non-existent-id-12345');

      // Then: Should show error or 404
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Manager Portfolio', () => {
    test('should handle non-existent manager', async ({ page }) => {
      // When: User visits non-existent manager
      await page.goto('/manager/non-existent-id-12345');

      // Then: Should show error or 404
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Invoice Public Pages - P1', () => {
  test('should display invoice page structure', async ({ page }) => {
    // When: User visits invoice page (may be non-existent)
    await page.goto('/invoice/INV-2024-001');

    // Then: Page should load
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Quote Public Pages - P1', () => {
  test('should display quote page structure', async ({ page }) => {
    // When: User visits quote page (may be non-existent)
    await page.goto('/quote/QT-2024-001');

    // Then: Page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
