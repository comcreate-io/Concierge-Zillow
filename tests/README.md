# Test Suite - Concierge-Zillow

Production-ready E2E test framework using Playwright.

## Quick Start

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers
npx playwright install

# Set up test environment
cp .env.example .env.test
# Edit .env.test with test credentials

# Run tests
npm run test:e2e
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all tests headlessly |
| `npm run test:e2e:ui` | Open Playwright UI for interactive testing |
| `npm run test:e2e:headed` | Run tests in visible browser |
| `npm run test:e2e:debug` | Run with Playwright Inspector |
| `npm run test:report` | View HTML test report |

## Environment Variables

Create `.env.test` with:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test User (required for authenticated tests)
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# App URL
BASE_URL=http://localhost:3000
```

## Directory Structure

```
tests/
├── e2e/                      # Test files
│   ├── auth.setup.ts         # Authentication setup (runs first)
│   ├── smoke.spec.ts         # Critical path smoke tests
│   ├── properties.spec.ts    # Property management tests
│   ├── invoices.spec.ts      # Invoice tests (P0)
│   └── login.unauth.spec.ts  # Unauthenticated tests
├── support/
│   ├── fixtures/
│   │   ├── index.ts          # Main fixture exports
│   │   └── factories/        # Data factories
│   │       ├── property-factory.ts
│   │       ├── client-factory.ts
│   │       ├── invoice-factory.ts
│   │       └── quote-factory.ts
│   ├── helpers/
│   │   └── supabase-helper.ts # Direct DB access
│   └── .auth/                # Auth state storage (gitignored)
└── README.md
```

## Test Architecture

### Fixtures with Auto-Cleanup

All data factories automatically clean up after each test:

```typescript
import { test, expect } from '../support/fixtures';

test('should create property', async ({ page, propertyFactory }) => {
  // Property is auto-created with sensible defaults
  const property = await propertyFactory.create();

  // Test your feature
  await page.goto(`/property/${property.id}`);
  await expect(page.locator('body')).toContainText(property.address);

  // No cleanup needed - factory handles it automatically
});
```

### Available Factories

| Factory | Methods |
|---------|---------|
| `propertyFactory` | `create()`, `createMany()`, `createLuxury()`, `assignToManager()` |
| `clientFactory` | `create()`, `createMany()`, `createPending()`, `assignProperty()`, `shareWith()` |
| `invoiceFactory` | `create()`, `createSent()`, `createPaid()`, `createOverdue()`, `createLuxury()` |
| `quoteFactory` | `create()`, `createSent()`, `createAccepted()`, `createExpired()`, `createLuxury()` |

### Direct Database Access

For complex scenarios, use the Supabase helper:

```typescript
test('custom scenario', async ({ supabase }) => {
  // Direct insert
  const record = await supabase.insert('table_name', { field: 'value' });

  // Query
  const records = await supabase.getWhere('table_name', 'field', 'value');

  // Update
  await supabase.update('table_name', record.id, { field: 'new_value' });

  // Delete
  await supabase.delete('table_name', record.id);
});
```

## Test Projects

| Project | Description | Auth State |
|---------|-------------|------------|
| `setup` | Authentication setup | Creates auth state |
| `chromium` | Main tests | Authenticated |
| `unauthenticated` | Login/public page tests | No auth |

## Writing Tests

### Naming Convention

- `*.spec.ts` - Authenticated tests (require login)
- `*.unauth.spec.ts` - Unauthenticated tests (public pages, login flow)

### Test Structure (Given-When-Then)

```typescript
test('should display property details', async ({ page, propertyFactory }) => {
  // Given: A property exists
  const property = await propertyFactory.create({
    address: '123 Test St, Miami, FL',
    bedrooms: '4',
  });

  // When: User visits property page
  await page.goto(`/property/${property.id}`);

  // Then: Property details are visible
  await expect(page.locator('body')).toContainText('123 Test St');
  await expect(page.locator('body')).toContainText('4');
});
```

### Selectors

Prefer `data-testid` attributes:

```typescript
// Good
await page.locator('[data-testid="submit-button"]').click();

// Acceptable (semantic)
await page.locator('button[type="submit"]').click();

// Avoid (brittle)
await page.locator('.btn-primary').click();
```

## CI/CD Integration

Tests are configured for CI with:

- Retries: 2 (only in CI)
- Workers: 1 (sequential in CI for stability)
- Artifacts: Screenshots, videos, traces on failure
- Reports: HTML + JUnit XML

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Debugging

### Playwright Inspector

```bash
npm run test:e2e:debug
```

### Trace Viewer

After test failure, view trace:

```bash
npx playwright show-trace test-results/*/trace.zip
```

### Screenshots & Videos

Captured automatically on failure in `test-results/`.

## Best Practices

1. **Test isolation**: Each test creates its own data, cleans up after
2. **No shared state**: Tests don't depend on each other
3. **Explicit waits**: Use `await expect()` not `waitForTimeout()`
4. **Deterministic data**: Factories generate unique data per run
5. **Page object pattern**: Use for complex, reusable interactions

## Troubleshooting

### "No test user credentials"

Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in environment.

### "Supabase connection failed"

Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key).

### "Auth setup failed"

1. Verify test user exists in Supabase Auth
2. Check credentials are correct
3. Ensure login page works manually

### Flaky tests

1. Add explicit waits: `await expect(locator).toBeVisible()`
2. Use network intercepts for API timing
3. Check for race conditions in data creation
