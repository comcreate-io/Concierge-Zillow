# Supabase CLI Setup Guide

This guide will help you set up and deploy your Supabase database schema and configurations using the Supabase CLI.

## Prerequisites

- Supabase CLI installed (`brew install supabase/tap/supabase` on macOS)
- A Supabase account at [supabase.com](https://supabase.com)
- A Supabase project created (or you'll create one during setup)

## Project Structure

```
supabase/
├── config.toml                    # Supabase project configuration
├── migrations/                    # Database migration files
│   ├── 20250110000001_create_properties_table.sql
│   ├── 20250110000002_create_property_managers_table.sql
│   ├── 20250110000003_enable_rls.sql
│   └── 20250110000004_create_updated_at_trigger.sql
└── seed/
    └── seed.sql                   # Sample data for development
```

## Setup Methods

### Method 1: Link to Existing Project and Push (Recommended)

If you already have a Supabase project:

1. **Get your project reference ID**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings > General
   - Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

2. **Link your local project to Supabase**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   You'll be prompted to enter your database password (found in Settings > Database)

3. **Push migrations to your remote database**
   ```bash
   supabase db push
   ```

4. **Verify the changes**
   ```bash
   # Check migration status
   supabase migration list

   # Or view tables in Supabase Studio
   # Go to Table Editor in your dashboard
   ```

5. **(Optional) Seed with sample data**
   ```bash
   # Connect to remote database and run seed file
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase/seed/seed.sql
   ```

### Method 2: Create New Project via CLI

If you want to create a new Supabase project:

1. **Login to Supabase**
   ```bash
   supabase login
   ```

2. **Create a new project**
   ```bash
   supabase projects create zillow-properties --org-id YOUR_ORG_ID --region us-west-1
   ```

3. **Link to the new project**
   ```bash
   supabase link --project-ref YOUR_NEW_PROJECT_REF
   ```

4. **Push migrations**
   ```bash
   supabase db push
   ```

### Method 3: Local Development First

Test everything locally before pushing to production:

1. **Start local Supabase**
   ```bash
   supabase start
   ```

   This will start:
   - PostgreSQL database
   - Supabase Studio (http://localhost:54323)
   - Auth server
   - Realtime server
   - Storage server

2. **Access local Supabase Studio**
   - Open http://localhost:54323
   - View tables and data
   - Test authentication flows

3. **Reset database (applies migrations + seeds)**
   ```bash
   supabase db reset
   ```

4. **When ready, link and push to production**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

5. **Stop local Supabase when done**
   ```bash
   supabase stop
   ```

## What Gets Created

### Tables

1. **properties**
   - Stores property listings from Zillow
   - Fields: address, monthly_rent, bedrooms, bathrooms, area, zillow_url, images, timestamps
   - Foreign key: property_manager_id

2. **property_managers**
   - Stores property managers
   - Fields: name, email, phone, timestamps

### Security

- Row Level Security (RLS) enabled on both tables
- Policies allow authenticated users to perform all CRUD operations
- You can modify policies in `supabase/migrations/20250110000003_enable_rls.sql`

### Triggers

- Automatic `updated_at` timestamp updates on row changes
- Defined in `supabase/migrations/20250110000004_create_updated_at_trigger.sql`

## Useful Commands

```bash
# Check CLI version
supabase --version

# List all projects
supabase projects list

# Check migration status
supabase migration list

# Create a new migration
supabase migration new add_new_column

# Generate types from database
supabase gen types typescript --local > types/database.types.ts
# or for remote:
supabase gen types typescript --linked > types/database.types.ts

# View local database connection string
supabase status

# View logs
supabase logs --follow

# Open Supabase Studio
supabase studio

# Pull remote schema changes
supabase db pull

# Diff local and remote schemas
supabase db diff
```

## Update Environment Variables

After setting up your database, update your `.env.local`:

```bash
# Your Supabase project URL (from project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Your Supabase anon/public key (from project settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database connection strings (from project settings > Database)
POSTGRES_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres"
POSTGRES_PRISMA_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Service role key (KEEP SECRET - only use server-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Modifying the Schema

### Adding New Migrations

1. **Create a new migration file**
   ```bash
   supabase migration new add_property_status
   ```

2. **Edit the generated file** in `supabase/migrations/`
   ```sql
   ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'available';
   ```

3. **Apply locally**
   ```bash
   supabase db reset
   ```

4. **Push to remote**
   ```bash
   supabase db push
   ```

### Modifying Existing Tables

Never modify old migration files. Always create new migrations:

```bash
supabase migration new update_properties_add_index
```

Example migration:
```sql
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);
```

## Troubleshooting

### "Project not linked"
Run `supabase link --project-ref YOUR_PROJECT_REF`

### "Migration already applied"
The migrations have already been run. Check with `supabase migration list`

### Local database won't start
```bash
# Stop everything
supabase stop --no-backup

# Remove volumes
docker volume prune

# Start fresh
supabase start
```

### Changes not appearing
```bash
# Reset local database
supabase db reset

# Or pull latest from remote
supabase db pull
```

### Permission denied errors
Make sure you're using the correct database password and have the right permissions.

## Production Deployment

### Using Vercel/Netlify

Your migrations are already in version control. When deploying:

1. Set environment variables in your hosting platform
2. Migrations run against your remote Supabase database
3. No additional deployment steps needed for the database

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy Supabase Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Supabase
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push migrations
        run: supabase db push
```

## Security Best Practices

1. **Never commit secrets**
   - Database passwords
   - Service role keys
   - API keys

2. **Use environment variables**
   - Keep `.env.local` in `.gitignore`
   - Use platform-specific secret management

3. **Review RLS policies**
   - The default policies allow all authenticated users
   - Consider restricting based on user roles
   - Test policies thoroughly

4. **Backup regularly**
   - Supabase Pro includes automatic backups
   - Export data manually: `supabase db dump -f backup.sql`

## Next Steps

- Enable email templates for authentication
- Set up custom SMTP for production emails
- Configure storage buckets for property images
- Add database functions for complex queries
- Set up monitoring and alerts

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
