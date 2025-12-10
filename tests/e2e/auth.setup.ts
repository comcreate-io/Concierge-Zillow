import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/support/.auth/user.json';

/**
 * Authentication setup - runs before other tests.
 * Logs in via Supabase Auth and saves session state.
 */
setup('authenticate', async ({ page }) => {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment variables'
    );
  }

  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await expect(page.locator('form')).toBeVisible();

  // Fill in credentials
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for successful login - should redirect to admin dashboard
  await page.waitForURL(/\/admin/, { timeout: 30000 });

  // Verify we're logged in by checking for admin navigation
  await expect(page.locator('[data-testid="admin-nav"], nav, .sidebar')).toBeVisible({
    timeout: 10000,
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
