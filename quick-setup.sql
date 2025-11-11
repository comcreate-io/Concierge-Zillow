-- Quick setup script for Supabase
-- Copy and paste this into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- 1. Create property_managers table
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

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_property_managers_email ON public.property_managers USING btree (email);

-- 3. Add property_manager_id to properties table (if properties table exists)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_manager_id UUID REFERENCES public.property_managers(id) ON DELETE SET NULL;

-- 4. Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON public.properties USING btree (property_manager_id);

-- 5. Enable Row Level Security
ALTER TABLE public.property_managers ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read property managers" ON public.property_managers;
CREATE POLICY "Allow authenticated users to read property managers"
  ON public.property_managers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert property managers" ON public.property_managers;
CREATE POLICY "Allow authenticated users to insert property managers"
  ON public.property_managers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update property managers" ON public.property_managers;
CREATE POLICY "Allow authenticated users to update property managers"
  ON public.property_managers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete property managers" ON public.property_managers;
CREATE POLICY "Allow authenticated users to delete property managers"
  ON public.property_managers
  FOR DELETE
  TO authenticated
  USING (true);

-- 7. Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for property_managers table
DROP TRIGGER IF EXISTS set_property_managers_updated_at ON public.property_managers;
CREATE TRIGGER set_property_managers_updated_at
  BEFORE UPDATE ON public.property_managers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Done! You can now add property managers.
