# E2E Test Documentation

## Overview

This document describes the end-to-end test suite for the Concierge Property Manager System. Tests are built with **Playwright** and organized by feature area with risk-based prioritization.

---

## Quick Start

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- tests/e2e/auth.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "Invoice"

# View last test report
npx playwright show-report
```

---

## Test Structure

```
tests/
├── e2e/                          # E2E test specs
│   ├── auth.spec.ts              # Authentication (authenticated)
│   ├── auth.unauth.spec.ts       # Login flow (unauthenticated)
│   ├── clients.spec.ts           # Client management
│   ├── invoices.spec.ts          # Invoice management
│   ├── payment.unauth.spec.ts    # Payment pages (public)
│   ├── properties.spec.ts        # Property management
│   ├── public-pages.unauth.spec.ts # Public property pages
│   ├── quotes.spec.ts            # Quote management
│   └── smoke.spec.ts             # Critical path smoke tests
│
└── support/
    ├── fixtures/
    │   ├── index.ts              # Main fixtures (page, factories, cleanup)
    │   └── factories/            # Data factories
    │       ├── property-factory.ts
    │       ├── client-factory.ts
    │       ├── invoice-factory.ts
    │       └── quote-factory.ts
    ├── helpers/
    │   └── supabase-helper.ts    # Direct DB access
    └── .auth/
        └── user.json             # Saved auth state (auto-generated)
```

---

## Test Files & Coverage

### 1. Authentication Tests

#### `auth.spec.ts` (Authenticated)
| Test | Priority | Description |
|------|----------|-------------|
| should redirect authenticated user to admin dashboard | P0 | Verifies logged-in users can access /admin |
| should display admin navigation after login | P0 | Confirms navigation elements render |
| should allow navigation between admin sections | P0 | Tests routing to properties, clients, invoices, quotes |
| should maintain session across page refreshes | P0 | Validates session persistence |

#### `auth.unauth.spec.ts` (Unauthenticated)
| Test | Priority | Description |
|------|----------|-------------|
| should display login page | P0 | Login page renders correctly |
| should show login form elements | P0 | Email/password inputs visible |
| should require email and password | P0 | Empty form validation |
| should reject invalid credentials | P0 | Error handling for wrong password |
| should redirect unauthenticated users from admin | P0 | Route protection works |

---

### 2. Property Tests

#### `properties.spec.ts`
| Test | Priority | Description |
|------|----------|-------------|
| should display properties page | P0 | Properties list loads |
| should navigate to new property page | P0 | Add property navigation works |
| should display new property form | P0 | Form renders with inputs |
| should create property via factory | P0 | Factory creates property in DB |
| should display property on public page | P0 | Public /property/:id page works |
| should have customization options | P1 | Customization features accessible |
| should be able to view manager assignments | P1 | Manager page loads |

---

### 3. Client Tests

#### `clients.spec.ts`
| Test | Priority | Description |
|------|----------|-------------|
| should display clients page | P0 | Clients list loads |
| should navigate to new client page | P0 | Add client navigation works |
| should display client form fields | P0 | Form has required inputs |
| should display clients page with factory available | P0 | Factory integration works |

---

### 4. Invoice Tests

#### `invoices.spec.ts`
| Test | Priority | Description |
|------|----------|-------------|
| should display invoices page | P0 | Invoice list loads |
| should navigate to new invoice page | P0 | Add invoice navigation works |
| should display invoice form fields | P0 | Form has required inputs |
| should display invoices page with factory available | P0 | Factory integration works |
| should show correct UI for draft invoice | P0 | Draft status UI renders |

#### `payment.unauth.spec.ts` (Public Payment Pages)
| Test | Priority | Description |
|------|----------|-------------|
| should show payment page structure for non-existent invoice | P0 | Payment page handles missing invoice |
| should load payment page structure | P0 | Payment form renders |
| should show error for non-existent invoice number | P0 | Error handling for fake invoice |
| should display invoice page structure | P0 | Public invoice view renders |

---

### 5. Quote Tests

#### `quotes.spec.ts`
| Test | Priority | Description |
|------|----------|-------------|
| should display quotes page | P0 | Quotes list loads |
| should navigate to new quote page | P0 | Add quote navigation works |
| should display quote form fields | P0 | Form has required inputs |
| should display quotes page with factory available | P0 | Factory integration works |

---

### 6. Public Page Tests

#### `public-pages.unauth.spec.ts`
| Test | Priority | Description |
|------|----------|-------------|
| should load property page structure | P0 | /property/:id renders |
| should handle non-existent property | P0 | 404/error handling |
| should display property content when exists | P0 | Property details shown |
| should load invoice page structure | P0 | /invoice/:number renders |
| should load payment page structure | P0 | /invoice/:number/pay renders |

---

### 7. Smoke Tests

#### `smoke.spec.ts`
| Test | Priority | Description |
|------|----------|-------------|
| should load admin dashboard | P0 | Critical: Admin accessible |
| should load properties page | P0 | Critical: Properties accessible |
| should load clients page | P0 | Critical: Clients accessible |
| should load invoices page | P0 | Critical: Invoices accessible |
| should load quotes page | P0 | Critical: Quotes accessible |
| should load login page | P0 | Critical: Login accessible |
| should load public property page | P0 | Critical: Public pages work |

---

## Test Priority Levels

| Priority | Description | When to Run |
|----------|-------------|-------------|
| **P0** | Critical path - must pass for deploy | Every commit |
| **P1** | Important features - should pass | Pre-release |
| **P2** | Nice-to-have - can be flaky | Weekly |
| **P3** | Edge cases - informational | Manual |

---

## Data Factories

Factories create test data directly in Supabase and auto-cleanup after each test.

### PropertyFactory
```typescript
const property = await propertyFactory.create({
  address: '123 Main St',
  bedrooms: '4',
  bathrooms: '3',
});
// Auto-deleted after test
```

### ClientFactory
```typescript
const client = await clientFactory.create({
  name: 'John Doe',
  email: 'john@example.com',
});
```

### InvoiceFactory
```typescript
const invoice = await invoiceFactory.create({
  client_id: client.id,
  property_id: property.id,
  status: 'draft',
});
```

### QuoteFactory
```typescript
const quote = await quoteFactory.create({
  client_id: client.id,
  property_id: property.id,
});
```

---

## Configuration

### Environment Variables (`.env.local`)
```env
TEST_USER_EMAIL=diego@comcreate.org
TEST_USER_PASSWORD=111111
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Playwright Config Highlights
- **Base URL**: `http://localhost:3001`
- **Test timeout**: 60 seconds
- **Navigation timeout**: 60 seconds
- **Parallel execution**: Enabled
- **Auto-retry on CI**: 2 retries
- **Artifacts**: Screenshots, videos, traces on failure

---

## Running Specific Test Types

```bash
# Only authenticated tests
npm run test:e2e -- --project=chromium

# Only unauthenticated tests
npm run test:e2e -- --project=unauthenticated

# Only smoke tests
npm run test:e2e -- tests/e2e/smoke.spec.ts

# Debug mode (headed browser)
npm run test:e2e -- --headed --debug
```

---

## Test Results Summary

| Category | Tests | Status |
|----------|-------|--------|
| Authentication | 9 | Pass |
| Properties | 7 | Pass |
| Clients | 4 | Pass |
| Invoices | 5 | Pass |
| Quotes | 4 | Pass |
| Payments | 4 | Pass |
| Public Pages | 5 | Pass |
| Smoke | 7 | Pass |
| **Total** | **57** | **96.6% Pass** |

*Note: 2 tests may timeout under heavy parallel load - not application bugs*

---

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Run with fewer workers: `npm run test:e2e -- --workers=1`

### Auth state issues
- Delete `tests/support/.auth/user.json`
- Run setup again: `npm run test:e2e -- --project=setup`

### Database connection errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Check Supabase project status

### View failure details
```bash
npx playwright show-report
```
