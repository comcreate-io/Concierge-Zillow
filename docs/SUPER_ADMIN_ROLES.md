# Super Admin Role System

## Overview

The system now supports two roles for property managers:
- **Regular Admin** (`admin`) - Default role with standard access
- **Superior Admin** (`super_admin`) - Enhanced role with elevated permissions

## Superior Admins

The following emails are designated as superior admins:
- `Brody@cadizlluis.com`
- `Devon@cadizlluis.com`

## Permissions

### Super Admin Only Features

1. **All Clients Page** (`/admin/clients-all`)
   - View all clients across the entire system
   - "Assign Admins" button for each client
   - Manage which admins have access to each client via checkbox dialog
   - Can see current admin assignments for each client
   - Can add/remove admin access with a single action

2. **System-Wide Client Management**
   - Assign ANY client to ANY admin (not just their own clients)
   - Remove admin access from any client
   - Bulk admin management through checkbox interface

### Features Available to All Admins

Both super admins and regular admins can:

1. **My Clients Page** - View their own owned and shared clients
2. **Client Sharing** - Share THEIR OWN clients with other admins
3. **Properties** - Manage properties
4. **Agents** - Manage listing agents
5. **Invoices** - Create and manage invoices
6. **Quotes** - Create and manage quotes
7. **Profile** - Manage their own profile

### Key Difference

- **Regular Admins**: Can only share clients they OWN (clients where they are the manager)
- **Super Admins**: Can assign ANY client in the system to ANY admin, regardless of ownership

## Implementation Details

### Database Schema

```sql
ALTER TABLE property_managers
ADD COLUMN role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin'));
```

### Helper Functions

Located in `lib/auth/roles.ts`:

```typescript
// Check if current user is super admin
await isSuperAdmin(): Promise<boolean>

// Get current user's role
await getCurrentUserRole(): Promise<UserRole | null>

// Require super admin (throws error if not)
await requireSuperAdmin(): Promise<void>
```

### Usage Example

```typescript
import { isSuperAdmin } from '@/lib/auth/roles'

export default async function MyPage() {
  const isSuper = await isSuperAdmin()

  if (!isSuper) {
    redirect('/admin/clients')
  }

  // Rest of super admin only code
}
```

## Navigation

The admin sidebar and mobile header automatically hide the "All Clients" link for regular admins. Only super admins will see this navigation item.

## Migration

To apply the role system, run the migration:

```bash
# The migration file is located at:
# supabase/migrations/add_superior_admin_role.sql

# This migration will:
# 1. Add the 'role' column to property_managers table
# 2. Set the two designated emails as super_admin
# 3. Create an index for faster role lookups
```

## Security

- Role checks are performed server-side in page components
- Client-side components receive role status as props from server components
- All sensitive operations (client sharing, admin management) require server-side role validation
- The role is stored in the database and cannot be modified by regular users

## Future Enhancements

Potential additions to the role system:
- Additional custom roles (e.g., `viewer`, `manager`)
- Granular permissions system
- Role management UI for super admins
- Activity logging for super admin actions
