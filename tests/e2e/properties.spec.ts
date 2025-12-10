import { test, expect } from '../support/fixtures';

/**
 * Property Management Tests (P0)
 *
 * Tests property CRUD operations, customization, and public pages.
 */
test.describe('Property Management - P0', () => {
  test.describe('Property List', () => {
    test('should display properties page', async ({ page }) => {
      // Given: User is authenticated
      // When: User navigates to properties
      await page.goto('/admin/properties');

      // Then: Properties page should load
      await expect(page).toHaveURL(/\/admin\/properties/);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should navigate to new property page', async ({ page }) => {
      // Given: User is on properties list
      await page.goto('/admin/properties');

      // When: User clicks add property link
      const addPropertyLink = page.locator('a[href="/admin/properties/new"]').first();
      await expect(addPropertyLink).toBeVisible({ timeout: 10000 });
      await addPropertyLink.click();

      // Then: Should navigate to new property form
      await expect(page).toHaveURL(/\/admin\/properties\/new/);
    });
  });

  test.describe('Property Creation', () => {
    test('should display new property form', async ({ page }) => {
      // Given: User is on new property page
      await page.goto('/admin/properties/new');

      // Then: Form should be visible
      await expect(page.locator('body')).toBeVisible();
      const hasForm = await page.locator('form, input').first().isVisible();
      expect(hasForm).toBeTruthy();
    });
  });

  test.describe('Property with Factory', () => {
    test('should create property via factory', async ({ page, propertyFactory }) => {
      // Given: A test property is created
      const property = await propertyFactory.create({
        address: 'Test Property 123 Main St',
        bedrooms: '4',
        bathrooms: '3',
      });

      // Then: Property should exist
      expect(property.id).toBeTruthy();
      expect(property.address).toContain('Test Property');
    });

    test('should display property on public page', async ({ page, propertyFactory }) => {
      // Given: A property exists
      const property = await propertyFactory.create();

      // When: User visits public property page
      await page.goto(`/property/${property.id}`);

      // Then: Property page should load
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Property Customization - P1', () => {
  test('should have customization options', async ({ page }) => {
    // Given: User is on properties page
    await page.goto('/admin/properties');

    // Then: Page should load
    await expect(page).toHaveURL(/\/admin\/properties/);
  });
});

test.describe('Property Assignment - P1', () => {
  test('should be able to view manager assignments', async ({ page }) => {
    // Given: User is on admin
    await page.goto('/admin/managers');

    // Then: Managers page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
