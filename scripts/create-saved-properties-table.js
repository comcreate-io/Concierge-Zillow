require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local', override: true })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.log('\n⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  console.log('Please add the following table manually via Supabase Dashboard:\n')
  console.log('1. Go to your Supabase project')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Run the following SQL:\n')
  console.log(`
-- Create saved_properties table for managers to save frequently used properties
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manager_id, property_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_properties_manager_id ON saved_properties(manager_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_properties
-- Managers can view their own saved properties
CREATE POLICY "Managers can view own saved properties" ON saved_properties
  FOR SELECT USING (
    manager_id IN (
      SELECT id FROM property_managers WHERE auth_user_id = auth.uid()
    )
  );

-- Managers can insert their own saved properties
CREATE POLICY "Managers can insert own saved properties" ON saved_properties
  FOR INSERT WITH CHECK (
    manager_id IN (
      SELECT id FROM property_managers WHERE auth_user_id = auth.uid()
    )
  );

-- Managers can delete their own saved properties
CREATE POLICY "Managers can delete own saved properties" ON saved_properties
  FOR DELETE USING (
    manager_id IN (
      SELECT id FROM property_managers WHERE auth_user_id = auth.uid()
    )
  );
`)
  process.exit(0)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSavedPropertiesTable() {
  console.log('Creating saved_properties table...\n')

  const { error } = await supabase.rpc('exec', {
    sql: `
      -- Create saved_properties table for managers to save frequently used properties
      CREATE TABLE IF NOT EXISTS saved_properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(manager_id, property_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_saved_properties_manager_id ON saved_properties(manager_id);
      CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);
    `
  })

  if (error) {
    console.error('Error creating table:', error.message)
    console.log('\n⚠️  Please create the table manually using Supabase Dashboard SQL Editor.')
    return
  }

  console.log('✅ saved_properties table created successfully!')
}

createSavedPropertiesTable()
