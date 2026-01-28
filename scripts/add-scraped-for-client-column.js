require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local', override: true })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.log('\n⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  console.log('Please add the following column manually via Supabase Dashboard:\n')
  console.log('1. Go to your Supabase project')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Run the following SQL:\n')
  console.log(`
-- Add scraped_for_client_id column to track which client a property was scraped for
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS scraped_for_client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_properties_scraped_for_client ON properties(scraped_for_client_id) WHERE scraped_for_client_id IS NOT NULL;
`)
  process.exit(0)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addScrapedForClientColumn() {
  console.log('Adding scraped_for_client_id column to properties table...\n')

  // Try to add the column using raw SQL
  const { error } = await supabase.rpc('exec', {
    sql: `
      ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS scraped_for_client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_properties_scraped_for_client ON properties(scraped_for_client_id) WHERE scraped_for_client_id IS NOT NULL;
    `
  })

  if (error) {
    console.error('Error adding column:', error.message)
    console.log('\n⚠️  Please add the column manually using Supabase Dashboard SQL Editor.')
    console.log('Run this SQL:')
    console.log(`
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS scraped_for_client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    `)
    return
  }

  console.log('✅ scraped_for_client_id column added successfully!')
}

addScrapedForClientColumn()
