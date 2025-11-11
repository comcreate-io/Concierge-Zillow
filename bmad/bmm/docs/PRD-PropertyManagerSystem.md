# Product Requirements Document
## Zillow Property Manager System

**Project:** Zillow Property Search
**Document Version:** 1.0
**Date:** 2025-11-10
**Author:** Diego
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Overview
A multi-property management system that enables administrators to aggregate properties from Zillow, assign them to property managers, and present them through personalized property manager pages. The system features Supabase authentication, admin-only access controls, and dynamic URL routing based on property manager names.

### 1.2 Problem Statement
Property managers need a centralized platform to showcase their managed properties to potential clients without requiring technical expertise or individual websites. Administrators need an efficient way to aggregate properties from Zillow and organize them by property manager.

### 1.3 Goals & Success Metrics
**Goals:**
- Enable admins to quickly add properties from Zillow URLs
- Create unique property manager pages with SEO-friendly URLs
- Display all properties in a main directory
- Provide property manager contact information alongside their properties

**Success Metrics:**
- Admin can add a new property in < 2 minutes
- Property manager pages load within 3 seconds
- Zero authentication bypasses (admin-only access maintained)
- Property manager pages are properly indexed by search engines

---

## 2. User Personas & Stakeholders

### 2.1 Primary Persona: Administrator (Diego)
**Role:** System Owner & Content Manager
**Responsibilities:**
- Add properties from Zillow
- Create and manage property manager profiles
- Assign properties to property managers (multiple managers per property)
- Maintain system data integrity

**Needs:**
- Fast property import from Zillow URLs
- Easy property manager assignment interface
- Overview of all properties and managers
- Secure admin-only access

**Pain Points:**
- Manual data entry is time-consuming
- Need to manage multiple property managers efficiently
- Properties need to be visible across multiple property manager pages

### 2.2 Secondary Persona: Property Manager
**Role:** Real Estate Professional
**Characteristics:**
- May not be tech-savvy
- Needs professional online presence
- Manages portfolio of properties
- Shares their URL with potential clients

**Needs:**
- Unique, shareable URL (domain.com/john-smith/)
- Professional property showcase
- Contact information displayed
- No system management required

### 2.3 Tertiary Persona: Public User/Client
**Role:** Property Seeker
**Needs:**
- Browse all available properties
- View properties by specific property manager
- See property manager contact information
- Easy navigation between property listings

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

#### FR-AUTH-001: Supabase Authentication
**Priority:** P0 (Critical)
**Description:** Implement Supabase authentication for secure admin access.

**Acceptance Criteria:**
- Admin can log in using email/password via Supabase
- Admin can log out securely
- Session persists across page refreshes
- Expired sessions redirect to login page
- Failed login attempts show appropriate error messages

**Technical Notes:**
- Use Supabase Auth SDK
- Implement middleware for protected routes
- Store session tokens securely

---

#### FR-AUTH-002: Admin-Only Access Control
**Priority:** P0 (Critical)
**Description:** Restrict all administrative functions to authenticated admin users only.

**Acceptance Criteria:**
- Only authenticated admins can access admin portal
- Unauthenticated users are redirected to login page
- Admin routes are protected by authentication middleware
- Public routes (property pages) remain accessible without authentication
- Role verification on each protected action

**Technical Notes:**
- Implement role-based access control (RBAC)
- Admin role stored in Supabase user metadata
- Protected routes: /admin/*

---

### 3.2 Property Management

#### FR-PROP-001: Add Property from Zillow URL
**Priority:** P0 (Critical)
**Description:** Admin can add properties by entering a Zillow property URL.

**Acceptance Criteria:**
- Admin portal has "Add Property" form with Zillow URL input field
- System extracts property data from Zillow URL (address, price, images, description)
- Admin can select one or multiple property managers from dropdown
- Property is saved to database with all extracted data
- Success message shown after property is added
- Error handling for invalid URLs or scraping failures

**Technical Notes:**
- Web scraping or Zillow API integration required
- Store property data: address, price, bedrooms, bathrooms, sqft, images[], description, zillow_url
- Many-to-many relationship: properties ↔ property_managers

**UI Elements:**
- Zillow URL input field (required)
- Property manager multi-select dropdown (required, can select multiple)
- Submit button
- Loading indicator during scraping
- Success/error notifications

---

#### FR-PROP-002: Property Data Model
**Priority:** P0 (Critical)
**Description:** Define comprehensive property data structure.

**Data Fields:**
- `id` (UUID, primary key)
- `zillow_url` (text, unique)
- `address` (text)
- `city` (text)
- `state` (text)
- `zip_code` (text)
- `price` (decimal)
- `bedrooms` (integer)
- `bathrooms` (decimal)
- `square_feet` (integer)
- `description` (text)
- `images` (array of text URLs)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships:**
- Many-to-many with property_managers via junction table `property_assignments`

---

#### FR-PROP-003: Property Manager Assignment
**Priority:** P0 (Critical)
**Description:** Admin can assign multiple property managers to a single property.

**Acceptance Criteria:**
- Multi-select dropdown shows all available property managers
- Admin can select 1 or more property managers
- Selected property managers are saved in junction table
- Property appears on all assigned property managers' pages
- Admin can edit assignments later (add/remove property managers)

**Technical Notes:**
- Junction table: `property_assignments` (property_id, property_manager_id)
- Dropdown populated from property_managers table
- Handle concurrent assignments

---

### 3.3 Property Manager Management

#### FR-PM-001: Add Property Manager
**Priority:** P0 (Critical)
**Description:** Admin can add new property managers through admin portal.

**Acceptance Criteria:**
- Admin portal has "Add Property Manager" form
- Form collects: First Name, Last Name, Phone, Username
- Username must be unique (used in URL)
- Username validation: lowercase, alphanumeric, hyphens allowed, no spaces
- Success message after property manager is created
- Property manager appears in assignment dropdowns immediately

**Form Fields:**
- First Name (required, text)
- Last Name (required, text)
- Phone (required, formatted phone number)
- Username (required, unique, URL-safe)

**Validation Rules:**
- Username: lowercase only, alphanumeric + hyphens, 3-30 characters, unique
- Phone: valid phone number format
- All fields required

---

#### FR-PM-002: Property Manager Data Model
**Priority:** P0 (Critical)
**Description:** Define property manager data structure.

**Data Fields:**
- `id` (UUID, primary key)
- `first_name` (text)
- `last_name` (text)
- `phone` (text)
- `username` (text, unique, indexed)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships:**
- Many-to-many with properties via `property_assignments`

---

#### FR-PM-003: Property Manager List View
**Priority:** P1 (High)
**Description:** Admin can view all property managers in admin portal.

**Acceptance Criteria:**
- List shows all property managers in table format
- Columns: Name, Phone, Username, Property Count, Actions
- Property Count shows number of assigned properties
- Actions: Edit, Delete (with confirmation)
- Sortable by name or property count
- Search/filter by name or username

---

### 3.4 Public-Facing Pages

#### FR-PUBLIC-001: Main Property Directory Page
**Priority:** P0 (Critical)
**Description:** Public page showing all properties across all property managers.

**Acceptance Criteria:**
- Accessible at domain.com/ (root URL)
- Displays all properties in grid/card layout
- Each property card shows: image, address, price, bed/bath, property manager(s)
- Clicking property opens detail view
- Responsive design (mobile, tablet, desktop)
- No authentication required

**UI Elements:**
- Property grid/cards
- Property manager name(s) badge on each card
- Sort options: price, date added, location
- Filter options: property manager, price range, bedrooms

---

#### FR-PUBLIC-002: Property Manager Page
**Priority:** P0 (Critical)
**Description:** Dedicated page for each property manager showing their assigned properties and contact info.

**URL Structure:**
- `domain.com/{username}/` (e.g., domain.com/john-smith/)

**Acceptance Criteria:**
- URL uses property manager's username
- Page displays property manager info: Full Name, Phone
- Shows all properties assigned to this property manager
- Property cards identical to main directory page
- 404 page if property manager username doesn't exist
- No authentication required
- SEO-optimized (meta tags, structured data)

**Page Sections:**
1. **Header**: Property Manager Name and Contact Info
2. **Properties Grid**: All assigned properties
3. **Footer**: Navigation back to main directory

---

#### FR-PUBLIC-003: Dynamic Routing
**Priority:** P0 (Critical)
**Description:** Implement dynamic routing to serve property manager pages.

**Acceptance Criteria:**
- Next.js dynamic route: `/[username]/page.tsx`
- Query property manager by username
- Handle 404 for non-existent usernames
- Generate static paths for all property managers (ISR/SSG)
- Revalidate when new property managers added

**Technical Notes:**
- Use Next.js App Router
- Implement `generateStaticParams` for SSG
- Add ISR for dynamic updates

---

### 3.5 Admin Portal

#### FR-ADMIN-001: Admin Dashboard
**Priority:** P1 (High)
**Description:** Central hub for admin operations.

**Sections:**
- **Properties Management**: Add, list, edit, delete properties
- **Property Managers Management**: Add, list, edit, delete property managers
- **Statistics**: Total properties, total property managers, recent activity

**Navigation:**
- Properties tab
- Property Managers tab
- Logout button

---

#### FR-ADMIN-002: Property List & Management
**Priority:** P0 (Critical)
**Description:** Admin can view and manage all properties.

**Acceptance Criteria:**
- Table view of all properties
- Columns: Image, Address, Price, Property Managers, Actions
- Actions: Edit (reassign property managers), Delete (with confirmation)
- Search by address
- Filter by property manager

---

#### FR-ADMIN-003: Edit Property Manager Assignment
**Priority:** P1 (High)
**Description:** Admin can change which property managers are assigned to a property.

**Acceptance Criteria:**
- Edit button opens modal with property manager multi-select
- Currently assigned managers are pre-selected
- Admin can add/remove property managers
- Changes saved immediately
- Property appears/disappears from respective property manager pages

---

## 4. Non-Functional Requirements

### NFR-001: Performance
- Property pages load within 3 seconds
- Admin portal operations complete within 2 seconds
- Image optimization for fast loading
- Database queries optimized with proper indexing

### NFR-002: Security
- All admin routes protected by authentication
- SQL injection prevention
- XSS protection
- CSRF tokens on all forms
- Environment variables for sensitive data
- Rate limiting on authentication endpoints

### NFR-003: Scalability
- Support 100+ property managers
- Support 1000+ properties
- Efficient many-to-many queries
- Pagination for large lists

### NFR-004: SEO & Accessibility
- SEO-friendly URLs (domain.com/john-smith/)
- Meta tags for all public pages
- Structured data (JSON-LD) for properties
- Alt text for all images
- WCAG 2.1 AA compliance
- Semantic HTML

### NFR-005: Responsive Design
- Mobile-first design
- Breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)
- Touch-friendly UI elements

---

## 5. Database Schema

### 5.1 Tables

#### `property_managers`
```sql
CREATE TABLE property_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_username ON property_managers(username);
```

#### `properties`
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zillow_url TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  price DECIMAL(12,2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  description TEXT,
  images JSONB, -- Array of image URLs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price ON properties(price);
CREATE INDEX idx_created_at ON properties(created_at DESC);
```

#### `property_assignments` (Junction Table)
```sql
CREATE TABLE property_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  property_manager_id UUID REFERENCES property_managers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, property_manager_id)
);

CREATE INDEX idx_property_id ON property_assignments(property_id);
CREATE INDEX idx_property_manager_id ON property_assignments(property_manager_id);
```

---

## 6. User Flows

### 6.1 Admin Adds Property with Property Managers
1. Admin logs into admin portal
2. Navigates to "Add Property" section
3. Enters Zillow property URL
4. System scrapes property data (loading indicator shown)
5. Admin selects 1+ property managers from multi-select dropdown
6. Clicks "Add Property"
7. Success message displayed
8. Property appears in admin property list
9. Property appears on selected property managers' public pages

### 6.2 Admin Adds New Property Manager
1. Admin logs into admin portal
2. Navigates to "Property Managers" section
3. Clicks "Add Property Manager"
4. Fills form: First Name, Last Name, Phone, Username
5. Username validated for uniqueness and format
6. Clicks "Save"
7. Success message displayed
8. Property manager appears in list and assignment dropdowns

### 6.3 Public User Views Property Manager Page
1. User navigates to domain.com/john-smith/
2. Page loads with property manager info at top
3. User sees grid of properties assigned to John Smith
4. User clicks property card to view details
5. User can contact property manager using displayed phone number

### 6.4 Public User Views All Properties
1. User navigates to domain.com/
2. Main directory page loads with all properties
3. User browses/filters properties
4. User sees property manager badges on each property
5. User clicks property manager name to visit their dedicated page

---

## 7. Epic Breakdown

### Epic 1: Authentication & Authorization
**Description:** Implement Supabase authentication with admin-only access control.

**Stories:**
- Set up Supabase project and configure auth
- Implement login page with email/password
- Create authentication middleware for protected routes
- Implement logout functionality
- Add session management and persistence
- Create role-based access control (admin role)

**Estimated Complexity:** Medium

---

### Epic 2: Property Manager Management
**Description:** Build property manager CRUD operations in admin portal.

**Stories:**
- Create property_managers database table
- Build "Add Property Manager" form in admin portal
- Implement username validation and uniqueness check
- Create property manager list view in admin portal
- Add edit property manager functionality
- Add delete property manager (with cascade handling)
- Display property manager count on list view

**Estimated Complexity:** Medium

---

### Epic 3: Property Management & Zillow Integration
**Description:** Enable adding properties from Zillow URLs with property manager assignment.

**Stories:**
- Create properties and property_assignments database tables
- Research Zillow scraping/API options and implement
- Build "Add Property" form in admin portal
- Implement Zillow URL validation
- Create property data extraction service
- Build property manager multi-select component
- Implement property-to-manager assignment logic
- Create property list view in admin portal
- Add edit property assignments functionality
- Add delete property (with cascade handling)

**Estimated Complexity:** High

---

### Epic 4: Public Property Pages & Routing
**Description:** Create public-facing pages for property directory and property manager pages.

**Stories:**
- Design property card component
- Build main property directory page (domain.com/)
- Implement property grid/list layout
- Create dynamic property manager page ([username])
- Implement 404 handling for invalid usernames
- Add property manager info display on their page
- Optimize images for web
- Implement property filtering/sorting
- Add SEO meta tags and structured data
- Ensure responsive design across devices

**Estimated Complexity:** High

---

## 8. Technical Considerations

### 8.1 Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS / shadcn/ui
- **State Management:** React Context / Zustand
- **Data Fetching:** Supabase Client
- **Zillow Integration:** Web scraping (Puppeteer/Playwright) or API

### 8.2 Zillow Data Extraction
**Options:**
1. **Web Scraping:** Use Puppeteer/Playwright to scrape property pages
   - Pros: No API required, free
   - Cons: Fragile (breaks with Zillow UI changes), slower, potential TOS issues

2. **Zillow API:** Use official Zillow API (if available)
   - Pros: Reliable, fast, official
   - Cons: May require API key, possible costs, limited endpoints

3. **Third-party Services:** Use services like ScraperAPI, Bright Data
   - Pros: Maintained, reliable
   - Cons: Subscription costs

**Recommendation:** Start with web scraping for MVP, evaluate API later based on scale and budget.

### 8.3 URL Structure & SEO
- Use property manager username in URL path
- Implement proper canonical URLs
- Add Open Graph tags for social sharing
- Generate sitemap.xml dynamically
- Use semantic HTML and proper heading hierarchy
- Add schema.org structured data for properties

### 8.4 Image Handling
- Store Zillow image URLs (hotlink)
- Alternative: Download and store in Supabase Storage
- Use Next.js Image component for optimization
- Implement lazy loading
- Generate responsive image sizes

---

## 9. Out of Scope (V1)

The following features are explicitly excluded from V1:
- Public user authentication/accounts
- Property manager self-service portal (they can't log in)
- Property editing after import (except reassigning managers)
- Custom property uploads (non-Zillow properties)
- Favorite/save properties functionality
- Property comparison tools
- Email notifications
- Analytics/tracking dashboard
- Multi-admin support (only 1 admin for V1)
- Property manager profiles beyond contact info
- Map view of properties
- Advanced search with multiple filters

---

## 10. Open Questions & Assumptions

### Open Questions:
1. What happens if a Zillow property listing is removed? Should we keep it or sync deletions?
2. Should property manager phone numbers be clickable (tel: links)?
3. Do we need property detail pages, or just cards/listings?
4. Should properties be manually sortable on property manager pages?
5. Rate limiting strategy for Zillow scraping?

### Assumptions:
- Admin has only one account (single admin)
- Property data is static after import (no sync with Zillow updates)
- Property managers don't need login access
- Public users don't need authentication
- English language only (no i18n)
- USD currency only
- US properties only

---

## 11. Success Criteria & Launch Checklist

### Definition of Done:
- [ ] Admin can log in securely via Supabase
- [ ] Admin can add property managers with all required fields
- [ ] Admin can add properties from Zillow URLs
- [ ] Admin can assign multiple property managers to a property
- [ ] Main directory page displays all properties
- [ ] Property manager pages are accessible at domain.com/{username}/
- [ ] All pages are responsive and mobile-friendly
- [ ] SEO meta tags are implemented
- [ ] No authentication bypasses (security tested)
- [ ] Page load times meet performance requirements
- [ ] 404 pages handle invalid routes gracefully

### Testing Checklist:
- [ ] Authentication flow tested (login, logout, session persistence)
- [ ] Property manager CRUD operations tested
- [ ] Property addition from Zillow URL tested with various property types
- [ ] Multi-assignment tested (1 property → multiple managers)
- [ ] URL routing tested for valid/invalid usernames
- [ ] Responsive design tested on mobile, tablet, desktop
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Security testing (SQL injection, XSS, CSRF)
- [ ] Performance testing (page load times, database queries)

---

## 12. Appendix

### A. Glossary
- **Property Manager:** Real estate professional managing properties
- **Admin:** System administrator (Diego) with full access
- **Zillow URL:** Direct link to a property listing on Zillow.com
- **Many-to-many:** Database relationship where one property can have multiple managers, and one manager can have multiple properties

### B. References
- Supabase Auth Documentation: https://supabase.com/docs/guides/auth
- Next.js Dynamic Routes: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
- Zillow Website: https://www.zillow.com

---

**Document Control:**
- Version: 1.0
- Last Updated: 2025-11-10
- Next Review Date: TBD
- Approval Status: Pending Review
