-- Property Managers Table
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

CREATE INDEX IF NOT EXISTS idx_property_managers_email ON public.property_managers USING btree (email) TABLESPACE pg_default;

-- Add property_manager_id to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_manager_id UUID REFERENCES public.property_managers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON public.properties USING btree (property_manager_id) TABLESPACE pg_default;

-- Properties Table (for reference)
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
  property_manager_id UUID REFERENCES public.property_managers(id) ON DELETE SET NULL,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_zillow_url_key UNIQUE (zillow_url)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_properties_zillow_url ON public.properties USING btree (zillow_url) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_properties_address ON public.properties USING btree (address) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_properties_scraped_at ON public.properties USING btree (scraped_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON public.properties USING btree (property_manager_id) TABLESPACE pg_default;
