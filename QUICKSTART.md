# Quickstart Guide

Get your admin dashboard up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account ([sign up here](https://supabase.com))
- Supabase CLI installed: `brew install supabase/tap/supabase`

## Quick Setup (3 steps)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Choose one of the following options:

#### Option A: Interactive Setup Script (Recommended)

```bash
./scripts/setup-supabase.sh
```

This will guide you through:
- Linking to your existing Supabase project
- Pushing migrations to create tables
- Optionally seeding with sample data

#### Option B: Manual Setup

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to create tables
supabase db push

# (Optional) Seed with sample data
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f supabase/seed/seed.sql
```

#### Option C: Local Development First

```bash
# Start local Supabase (requires Docker)
supabase start

# Open Studio to view tables
open http://localhost:54323

# When ready, link and push to production
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 3. Configure Environment

Your `.env.local` should already have Supabase credentials. Verify they're correct:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# ... other variables
```

## Run the Application

```bash
npm run dev
```

Open http://localhost:3000/login

## First Login

1. Go to http://localhost:3000/login
2. Click "Sign Up"
3. Enter your email and password
4. Check your email for confirmation (if enabled in Supabase settings)
5. Log in and start managing properties!

## What Was Created

### Database Tables

- **properties** - Property listings with details (address, rent, bedrooms, etc.)
- **property_managers** - Property managers with contact info
- Relationship: Each property can be assigned to a property manager

### Authentication

- Email/password authentication via Supabase
- Protected admin routes
- Auto-redirect for unauthenticated users

### Admin Dashboard

- `/admin` - View and manage property managers
- `/admin/manager/[id]` - Assign properties to a manager
- `/login` - Authentication page

## Common Tasks

### Add a Property Manager

1. Log in to `/admin`
2. Click "Add Property Manager"
3. Fill in name, email, and phone
4. Click "Add Manager"

### Assign Properties

1. From admin dashboard, click "Manage Properties" on a manager
2. Search for properties using the search box
3. Click "+" to assign a property
4. Click "X" to unassign a property

### Manage Database

Use the helper script for common operations:

```bash
./scripts/supabase-helpers.sh
```

Or use Supabase CLI directly:

```bash
# View migration status
supabase migration list

# Create new migration
supabase migration new add_new_column

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --linked > types/database.types.ts
```

## Troubleshooting

### Can't log in after signup

Supabase might require email confirmation. Either:
- Check your email for confirmation link
- Disable confirmations: Supabase Dashboard > Authentication > Settings > Enable email confirmations (OFF)

### Tables not found

Make sure migrations were pushed:
```bash
supabase migration list
# If not applied, run:
supabase db push
```

### Environment variables not working

- Restart the dev server: `npm run dev`
- Check `.env.local` has correct values
- Verify variable names start with `NEXT_PUBLIC_` for client-side

### Local Supabase won't start

```bash
# Stop and remove Docker containers
supabase stop --no-backup
docker system prune -a

# Start fresh
supabase start
```

## Next Steps

- [ ] Customize authentication emails
- [ ] Add property images support
- [ ] Implement role-based access control
- [ ] Add property search and filtering
- [ ] Set up production deployment
- [ ] Enable database backups

## Need Help?

- [Full Setup Guide](./SUPABASE_CLI_SETUP.md) - Detailed Supabase CLI documentation
- [Admin Setup Guide](./ADMIN_SETUP.md) - Admin dashboard features
- [Supabase Docs](https://supabase.com/docs) - Official documentation
- [Next.js Docs](https://nextjs.org/docs) - Next.js documentation

## File Structure

```
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── login/              # Authentication page
│   └── auth/callback/      # Auth callback handler
├── components/             # React components
├── lib/
│   ├── supabase/          # Supabase client utilities
│   └── actions/           # Server actions
├── supabase/
│   ├── config.toml        # Supabase configuration
│   ├── migrations/        # Database migrations
│   └── seed/              # Sample data
├── scripts/               # Helper scripts
├── .env.local            # Environment variables
└── middleware.ts         # Route protection
```
