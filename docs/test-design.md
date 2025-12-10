# Test Design: Concierge-Zillow Property Manager System

**Date:** 2024-12-10
**Author:** Diego (via TEA Agent)
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for brownfield Property Manager System

**Risk Summary:**
- Total risks identified: 12
- High-priority risks (≥6): 5
- Critical categories: SEC, BUS, DATA

**Coverage Summary:**
- P0 scenarios: 24 (~48 hours)
- P1 scenarios: 32 (~32 hours)
- P2/P3 scenarios: 18 (~9 hours)
- **Total effort**: 89 hours (~11 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-001 | SEC | Unauthorized access to admin routes | 2 | 3 | 6 | Verify middleware auth guards on all /admin/* routes | QA |
| R-002 | BUS | Payment processing fails silently | 2 | 3 | 6 | Test all declined card scenarios, verify error messages | QA |
| R-003 | DATA | Invoice line items orphaned on rollback failure | 2 | 3 | 6 | Test transaction rollback on partial insert failures | QA |
| R-004 | SEC | Client data exposed to wrong manager | 2 | 3 | 6 | Test RLS policies, verify sharing isolation | QA |
| R-005 | BUS | Quote to Invoice conversion loses data | 2 | 3 | 6 | Verify all service items transfer correctly | QA |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-006 | TECH | PDF generation fails for large invoices | 2 | 2 | 4 | Test with 20+ line items | QA |
| R-007 | DATA | Duplicate slug generation race condition | 2 | 2 | 4 | Test concurrent client creation | QA |
| R-008 | BUS | Expired quotes still show actions | 1 | 3 | 3 | Verify status-based UI state | QA |
| R-009 | PERF | Property list slow with 100+ items | 2 | 2 | 4 | Performance test with pagination | QA |
| R-010 | OPS | Email delivery failures not logged | 1 | 3 | 3 | Test SMTP failure handling | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-011 | BUS | Contact form spam | 1 | 2 | 2 | Monitor |
| R-012 | TECH | Image upload size limits unclear | 1 | 1 | 1 | Monitor |

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| ID | Requirement | Test Level | Risk Link | Test Count | Owner |
|----|-------------|------------|-----------|------------|-------|
| P0-001 | User can log in with valid credentials | E2E | R-001 | 2 | QA |
| P0-002 | Invalid credentials show error | E2E | R-001 | 2 | QA |
| P0-003 | Unauthenticated users redirected from admin | E2E | R-001 | 1 | QA |
| P0-004 | Admin dashboard loads after login | E2E | - | 1 | QA |
| P0-005 | Properties list displays | E2E | - | 1 | QA |
| P0-006 | Property CRUD operations work | E2E | - | 4 | QA |
| P0-007 | Invoice can be created with line items | E2E | R-003 | 2 | QA |
| P0-008 | Invoice status workflow (draft→sent→viewed→paid) | E2E | R-002 | 4 | QA |
| P0-009 | Payment success with valid card (4242...) | E2E | R-002 | 1 | QA |
| P0-010 | Payment declined shows correct error | E2E | R-002 | 3 | QA |
| P0-011 | Already paid invoice shows error on payment | E2E | R-002 | 1 | QA |
| P0-012 | Client property assignment works | E2E | R-004 | 2 | QA |

**Total P0**: 24 tests, 48 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| ID | Requirement | Test Level | Risk Link | Test Count | Owner |
|----|-------------|------------|-----------|------------|-------|
| P1-001 | Quote CRUD operations | E2E | - | 4 | QA |
| P1-002 | Quote status workflow (draft→sent→viewed→accepted/declined) | E2E | R-008 | 4 | QA |
| P1-003 | Quote to Invoice conversion | E2E | R-005 | 2 | QA |
| P1-004 | Quote email with PDF link | E2E | R-010 | 1 | QA |
| P1-005 | Client CRUD operations | E2E | - | 4 | QA |
| P1-006 | Client slug uniqueness | API | R-007 | 2 | QA |
| P1-007 | Client sharing between managers | E2E | R-004 | 3 | QA |
| P1-008 | Public property page displays | E2E | - | 2 | QA |
| P1-009 | Public client portfolio page | E2E | - | 2 | QA |
| P1-010 | Invoice PDF generation | E2E | R-006 | 2 | QA |
| P1-011 | Quote PDF generation | E2E | R-006 | 2 | QA |
| P1-012 | Property customization options | E2E | - | 4 | QA |

**Total P1**: 32 tests, 32 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| ID | Requirement | Test Level | Risk Link | Test Count | Owner |
|----|-------------|------------|-----------|------------|-------|
| P2-001 | Property manager profiles | E2E | - | 2 | QA |
| P2-002 | Property drag-and-drop ordering | E2E | - | 2 | QA |
| P2-003 | Client property pricing visibility toggles | E2E | - | 3 | QA |
| P2-004 | Bulk property assignment | E2E | - | 2 | QA |
| P2-005 | Contact forms submission | E2E | R-011 | 3 | QA |
| P2-006 | Image upload to Cloudinary | E2E | R-012 | 2 | QA |
| P2-007 | Invoice duplicate functionality | E2E | - | 1 | QA |
| P2-008 | Quote duplicate functionality | E2E | - | 1 | QA |

**Total P2**: 16 tests, 8 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| ID | Requirement | Test Level | Test Count | Owner |
|----|-------------|------------|------------|-------|
| P3-001 | Performance: 100+ properties list | E2E | 1 | QA |
| P3-002 | Performance: Large invoice PDF (20+ items) | E2E | 1 | QA |

**Total P3**: 2 tests, 1 hour

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Homepage loads (30s)
- [ ] Login page renders (30s)
- [ ] Admin redirects unauthenticated (30s)
- [ ] Properties page loads (45s)
- [ ] Invoices page loads (45s)

**Total**: 5 scenarios

### P0 Tests (<15 min)

**Purpose**: Critical path validation

- [ ] Login flow (E2E)
- [ ] Property CRUD (E2E)
- [ ] Invoice create + payment (E2E)
- [ ] Client assignment (E2E)

**Total**: 24 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] Quote workflow (E2E)
- [ ] Quote→Invoice conversion (E2E)
- [ ] Client sharing (E2E)
- [ ] PDF generation (E2E)
- [ ] Public pages (E2E)

**Total**: 32 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] Property ordering (E2E)
- [ ] Contact forms (E2E)
- [ ] Image upload (E2E)
- [ ] Performance tests (E2E)

**Total**: 18 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 24 | 2.0 | 48 | Complex setup, payment flow |
| P1 | 32 | 1.0 | 32 | Standard coverage |
| P2 | 16 | 0.5 | 8 | Simple scenarios |
| P3 | 2 | 0.5 | 1 | Performance only |
| **Total** | **74** | **-** | **89** | **~11 days** |

### Prerequisites

**Test Data Factories (Created):**
- PropertyFactory (create, createLuxury, assignToManager)
- ClientFactory (create, createPending, assignProperty, shareWith)
- InvoiceFactory (create, createSent, createPaid, createOverdue)
- QuoteFactory (create, createSent, createAccepted, createExpired)

**Tooling:**
- Playwright for E2E testing
- Supabase service role for direct DB access

**Environment:**
- Test user with manager profile in Supabase Auth
- SMTP credentials for email testing (or mock)
- Cloudinary account for image upload testing

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80%
- **Security scenarios**: 100%
- **Business logic**: ≥70%
- **Edge cases**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] Security tests (SEC category) pass 100%
- [ ] Payment flow tests pass 100%

---

## Test Scenarios Detail

### Authentication (P0)

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Valid login | Enter valid email/password, submit | Redirect to /admin |
| Invalid login | Enter wrong password, submit | Error toast, stay on login |
| Empty fields | Submit empty form | Validation error |
| Session persistence | Login, close browser, reopen | Still authenticated |
| Logout | Click logout | Session cleared, redirect to login |
| Protected route | Visit /admin without auth | Redirect to /login |

### Invoice Payment (P0)

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Successful payment | Enter 4242..., valid expiry, CVV | Success message, status=paid |
| Declined card | Enter 4000000000000002 | "Card declined" error |
| Insufficient funds | Enter 4000000000009995 | "Insufficient funds" error |
| Expired card | Enter 4000000000000069 | "Card expired" error |
| Wrong CVV | Enter 4000000000000127 | "Incorrect CVV" error |
| Already paid | Visit payment page for paid invoice | "Already paid" error |
| Draft invoice | Visit payment page for draft | "Not sent" error |

### Quote to Invoice (P1)

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Convert accepted quote | Click convert on accepted quote | Invoice created, linked to quote |
| Convert draft | Try convert on draft quote | Error: only accepted |
| Convert already converted | Try convert again | Error: already converted |
| Data integrity | Convert, compare service items to line items | All items transferred |

---

## Next Steps

1. **Install Playwright** - `npm install && npx playwright install`
2. **Configure test user** - Set TEST_USER_EMAIL/PASSWORD in .env
3. **Run `*automate`** - Generate tests from this design
4. **Execute smoke tests** - `npm run test:e2e`
5. **Review failures** - Fix any environment issues
6. **Set up CI** - Run `*ci` workflow

---

## Appendix

### Feature Matrix (Discovered from Codebase)

| Feature | Routes | Server Actions | Components |
|---------|--------|----------------|------------|
| Auth | /login, /auth/callback | - | - |
| Properties | /admin/properties/*, /property/[id] | lib/actions/properties.ts | property-*, properties-list |
| Clients | /admin/clients/*, /client/[id] | lib/actions/clients.ts | client-*, clients-list |
| Invoices | /admin/invoices/*, /invoice/[number]/* | lib/actions/invoices.ts | invoice-*, invoices-list |
| Quotes | /admin/quotes/*, /quote/[number] | lib/actions/quotes.ts | quote-*, quotes-list |
| Managers | /admin/managers/*, /manager/[id] | lib/actions/property-managers.ts | manager-*, property-manager-* |
| Contact | /api/contact, /api/property-contact | - | contact-form |

### Database Tables (Inferred)

- properties
- property_managers
- property_manager_assignments
- clients
- client_property_assignments
- client_shares
- invoices
- invoice_line_items
- quotes
- quote_service_items

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad/bmm/testarch/test-design`
