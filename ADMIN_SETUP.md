# Admin Dashboard Setup Guide

This guide will help you set up the admin dashboard for managing property managers and their associated properties.

## Features

- Email authentication with Supabase
- Add, view, and delete property managers
- Assign properties to property managers
- Search and filter available properties
- Protected admin routes with middleware

## Database Setup

### 1. Run the SQL Schema

Execute the SQL commands in `database-schema.sql` in your Supabase SQL editor:

```sql
-- Create the property_managers table
CREATE TABLE IF NOT EXISTS public.property_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT property_managers_pkey PRIMARY KEY (id),
  CONSTRAINT property_managers_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_managers_email ON public.property_managers USING btree (email) TABLESPACE pg_default;

-- Add property_manager_id column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_manager_id UUID REFERENCES public.property_managers(id) ON DELETE SET NULL;

-- Add index for the foreign key
CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON public.properties USING btree (property_manager_id) TABLESPACE pg_default;
```

### 2. Enable Row Level Security (RLS) - Optional but Recommended

For better security, enable RLS on your tables:

```sql
-- Enable RLS on property_managers
ALTER TABLE public.property_managers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read property managers
CREATE POLICY "Allow authenticated users to read property managers" ON public.property_managers
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert property managers
CREATE POLICY "Allow authenticated users to insert property managers" ON public.property_managers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update property managers
CREATE POLICY "Allow authenticated users to update property managers" ON public.property_managers
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to delete property managers
CREATE POLICY "Allow authenticated users to delete property managers" ON public.property_managers
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on properties (if not already enabled)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read properties
CREATE POLICY "Allow authenticated users to read properties" ON public.properties
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update properties
CREATE POLICY "Allow authenticated users to update properties" ON public.properties
  FOR UPDATE
  TO authenticated
  USING (true);
```

### 3. Configure Supabase Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Ensure email authentication is enabled
4. Configure email templates if needed
5. (Optional) Disable email confirmation for testing by turning off "Enable email confirmations"

## Running the Application

1. Make sure your environment variables are set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - Login page: `http://localhost:3000/login`
   - Admin dashboard: `http://localhost:3000/admin` (requires authentication)

## Usage

### Creating an Admin Account

1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign Up"
4. Check your email for the confirmation link (if email confirmation is enabled)
5. After confirming, you can log in

### Managing Property Managers

1. Log in to the admin dashboard
2. Click "Add Property Manager" to create a new manager
3. Fill in the required information (name, email, and optional phone)
4. Click "Add Manager"

### Assigning Properties

1. From the admin dashboard, click "Manage Properties" on any property manager card
2. Use the search box to filter available properties by address
3. Click the "+" button next to a property to assign it to the manager
4. Click the "X" button on an assigned property to unassign it

## File Structure

```
app/
├── admin/
│   ├── layout.tsx                 # Admin layout with auth check
│   ├── page.tsx                   # Property managers list page
│   └── manager/
│       └── [id]/
│           └── page.tsx           # Property assignment page
├── login/
│   └── page.tsx                   # Login/signup page
└── auth/
    └── callback/
        └── route.ts               # Auth callback handler

components/
├── admin-nav.tsx                  # Admin navigation bar
├── add-property-manager-dialog.tsx # Dialog for adding managers
├── property-manager-list.tsx      # List of property managers
└── property-assignment.tsx        # Property assignment interface

lib/
├── supabase/
│   ├── client.ts                  # Client-side Supabase client
│   ├── server.ts                  # Server-side Supabase client
│   └── middleware.ts              # Auth middleware helpers
└── actions/
    ├── property-managers.ts       # Server actions for managers
    └── properties.ts              # Server actions for properties

middleware.ts                      # Next.js middleware for route protection
database-schema.sql                # Database schema and migrations
```

## Security Notes

- All admin routes are protected by middleware that checks for authenticated users
- Unauthenticated users are automatically redirected to `/login`
- The middleware refreshes user sessions automatically
- Consider enabling RLS policies for additional database-level security

## Troubleshooting

### "Invalid API key" error
- Verify your `.env.local` file has the correct Supabase credentials
- Make sure you're using `NEXT_PUBLIC_` prefix for client-side variables

### Can't log in after signup
- Check if email confirmation is enabled in Supabase
- Look for the confirmation email in your inbox
- Or disable email confirmation in Supabase settings for testing

### Properties not loading
- Ensure the properties table exists and has data
- Check the browser console for error messages
- Verify RLS policies allow authenticated users to read properties

### Middleware redirect loop
- Clear your browser cookies
- Check that middleware.ts is correctly configured
- Verify the matcher pattern in middleware.ts

## Next Steps

- Add role-based access control (admin vs. manager roles)
- Add property manager dashboard for viewing their assigned properties
- Implement property filtering and advanced search
- Add bulk property assignment
- Create reports and analytics dashboard
