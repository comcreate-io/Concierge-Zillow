#!/usr/bin/env node

// Database Setup Script
// This script creates all necessary tables in Supabase

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const migrations = [
  // Migration 1: Create properties table
  `
  CREATE TABLE IF NOT EXISTS public.properties (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    address TEXT NULL,
    monthly_rent TEXT NULL,
    bedrooms TEXT NULL,
    bathrooms TEXT NULL,
    area TEXT NULL,
    zillow_url TEXT NOT NULL,
    images JSONB NULL DEFAULT '[]'::jsonb,
    scraped_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT properties_pkey PRIMARY KEY (id),
    CONSTRAINT properties_zillow_url_key UNIQUE (zillow_url)
  );

  CREATE INDEX IF NOT EXISTS idx_properties_zillow_url ON public.properties USING btree (zillow_url);
  CREATE INDEX IF NOT EXISTS idx_properties_address ON public.properties USING btree (address);
  CREATE INDEX IF NOT EXISTS idx_properties_scraped_at ON public.properties USING btree (scraped_at DESC);
  `,

  // Migration 2: Create property_managers table
  `
  CREATE TABLE IF NOT EXISTS public.property_managers (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT property_managers_pkey PRIMARY KEY (id),
    CONSTRAINT property_managers_email_key UNIQUE (email)
  );

  CREATE INDEX IF NOT EXISTS idx_property_managers_email ON public.property_managers USING btree (email);

  ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_manager_id UUID REFERENCES public.property_managers(id) ON DELETE SET NULL;

  CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON public.properties USING btree (property_manager_id);
  `,

  // Migration 3: Enable RLS
  `
  ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.property_managers ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Allow authenticated users to read properties" ON public.properties;
  CREATE POLICY "Allow authenticated users to read properties"
    ON public.properties FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "Allow authenticated users to update properties" ON public.properties;
  CREATE POLICY "Allow authenticated users to update properties"
    ON public.properties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow authenticated users to insert properties" ON public.properties;
  CREATE POLICY "Allow authenticated users to insert properties"
    ON public.properties FOR INSERT TO authenticated WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow authenticated users to delete properties" ON public.properties;
  CREATE POLICY "Allow authenticated users to delete properties"
    ON public.properties FOR DELETE TO authenticated USING (true);

  DROP POLICY IF EXISTS "Allow authenticated users to read property managers" ON public.property_managers;
  CREATE POLICY "Allow authenticated users to read property managers"
    ON public.property_managers FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "Allow authenticated users to insert property managers" ON public.property_managers;
  CREATE POLICY "Allow authenticated users to insert property managers"
    ON public.property_managers FOR INSERT TO authenticated WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow authenticated users to update property managers" ON public.property_managers;
  CREATE POLICY "Allow authenticated users to update property managers"
    ON public.property_managers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow authenticated users to delete property managers" ON public.property_managers;
  CREATE POLICY "Allow authenticated users to delete property managers"
    ON public.property_managers FOR DELETE TO authenticated USING (true);
  `,

  // Migration 4: Create triggers
  `
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
  CREATE TRIGGER set_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

  DROP TRIGGER IF EXISTS set_property_managers_updated_at ON public.property_managers;
  CREATE TRIGGER set_property_managers_updated_at
    BEFORE UPDATE ON public.property_managers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  `
]

async function runMigrations() {
  console.log('🚀 Starting database setup...\n')

  for (let i = 0; i < migrations.length; i++) {
    console.log(`📝 Running migration ${i + 1}/${migrations.length}...`)

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: migrations[i] })

      if (error) {
        console.error(`❌ Migration ${i + 1} failed:`, error.message)

        // If exec_sql doesn't exist, we need to use a different approach
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('\n⚠️  Direct SQL execution not available.')
          console.log('Please run the migrations manually in Supabase Dashboard:\n')
          console.log('1. Go to: https://supabase.com/dashboard/project/esdkkyekfnpmwifyohac/editor')
          console.log('2. Copy the SQL from: supabase/migrations/')
          console.log('3. Run each migration file in order\n')
          process.exit(1)
        }
      } else {
        console.log(`✅ Migration ${i + 1} completed successfully`)
      }
    } catch (err) {
      console.error(`❌ Migration ${i + 1} error:`, err.message)
    }
  }

  // Verify tables were created
  console.log('\n🔍 Verifying tables...')

  const { data: managers, error: mgError } = await supabase
    .from('property_managers')
    .select('count')
    .limit(1)

  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('count')
    .limit(1)

  if (!mgError && !propError) {
    console.log('✅ property_managers table: OK')
    console.log('✅ properties table: OK')
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\nYou can now:')
    console.log('1. Start your app: npm run dev')
    console.log('2. Go to: http://localhost:3000/login')
    console.log('3. Create an account and add property managers')
  } else {
    if (mgError) console.error('❌ property_managers table:', mgError.message)
    if (propError) console.error('❌ properties table:', propError.message)

    console.log('\n⚠️  Manual setup required.')
    console.log('Run this in Supabase SQL Editor:')
    console.log('File: quick-setup.sql')
  }
}

runMigrations().catch(console.error)
