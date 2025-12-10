import { test, expect } from '@playwright/test';

/**
 * Login Page Tests (Unauthenticated)
 *
 * These tests run WITHOUT authentication to verify login flow.
 * File suffix .unauth.spec.ts ensures these run in unauthenticated project.
 */
test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    // Given: User is not authenticated
    // When: User visits login page
    await page.goto('/login');

    // Then: Login form should be visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Given: User is on login page
    await page.goto('/login');

    // When: User enters invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Then: Error message should be displayed
    // Wait for either error message or stay on login page
    await page.waitForTimeout(2000); // Allow time for auth attempt

    // Should either show error or stay on login page
    const currentUrl = page.url();
    const hasError = await page.locator('[role="alert"], .error, .text-red, .text-destructive').isVisible().catch(() => false);

    // Either we see an error OR we're still on login page (not redirected to admin)
    expect(hasError || currentUrl.includes('/login')).toBeTruthy();
  });

  test('should redirect unauthenticated users from admin', async ({ page }) => {
    // Given: User is not authenticated
    // When: User tries to access admin page
    await page.goto('/admin');

    // Then: Should be redirected to login
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
  });
});

test.describe('Public Pages', () => {
  test('should display homepage', async ({ page }) => {
    // Given: Any user
    // When: User visits homepage
    await page.goto('/');

    // Then: Homepage should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display properties listing', async ({ page }) => {
    // Given: Any user
    // When: User visits properties page
    await page.goto('/properties');

    // Then: Properties page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
