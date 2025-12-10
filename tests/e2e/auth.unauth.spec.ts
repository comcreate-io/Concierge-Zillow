import { test, expect } from '@playwright/test';

/**
 * Unauthenticated Authentication Tests (P0)
 * Risk: R-001 - Unauthorized access to admin routes
 *
 * Tests login flow and route protection for unauthenticated users.
 */
test.describe('Authentication - Unauthenticated - P0', () => {
  test.describe('Login Page', () => {
    test('should display login form with all fields', async ({ page }) => {
      // When: User visits login page
      await page.goto('/login');

      // Then: Login form should have email, password, and submit button
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Given: User is on login page
      await page.goto('/login');

      // When: User enters invalid credentials and submits
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword123');
      await page.click('button[type="submit"]');

      // Then: Should show error or stay on login page
      await page.waitForTimeout(2000);

      // Either error message visible or still on login page
      const isOnLogin = page.url().includes('/login');
      const hasError = await page.locator('[role="alert"], .error, [class*="destructive"]').isVisible().catch(() => false);

      expect(isOnLogin || hasError).toBeTruthy();
    });

    test('should show error for empty email', async ({ page }) => {
      // Given: User is on login page
      await page.goto('/login');

      // When: User submits with empty email
      await page.fill('input[type="password"]', 'somepassword');
      await page.click('button[type="submit"]');

      // Then: Form validation should prevent submission
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show error for empty password', async ({ page }) => {
      // Given: User is on login page
      await page.goto('/login');

      // When: User submits with empty password
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      // Then: Form validation should prevent submission
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toHaveAttribute('required', '');
    });
  });

  test.describe('Route Protection', () => {
    test('should redirect /admin to login', async ({ page }) => {
      // When: Unauthenticated user visits admin
      await page.goto('/admin');

      // Then: Should redirect to login
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });

    test('should redirect /admin/properties to login', async ({ page }) => {
      // When: Unauthenticated user visits admin properties
      await page.goto('/admin/properties');

      // Then: Should redirect to login
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });

    test('should redirect /admin/invoices to login', async ({ page }) => {
      // When: Unauthenticated user visits admin invoices
      await page.goto('/admin/invoices');

      // Then: Should redirect to login
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });

    test('should redirect /admin/clients to login', async ({ page }) => {
      // When: Unauthenticated user visits admin clients
      await page.goto('/admin/clients');

      // Then: Should redirect to login
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });
  });

  test.describe('Public Pages - Accessible', () => {
    test('should display homepage without auth', async ({ page }) => {
      // When: User visits homepage
      await page.goto('/');

      // Then: Homepage should load
      await expect(page.locator('body')).toBeVisible();
      // Should NOT redirect to login
      expect(page.url()).not.toMatch(/login/);
    });

    test('should display properties listing without auth', async ({ page }) => {
      // When: User visits properties page
      await page.goto('/properties');

      // Then: Properties page should load
      await expect(page.locator('body')).toBeVisible();
      expect(page.url()).toMatch(/properties/);
    });
  });
});
