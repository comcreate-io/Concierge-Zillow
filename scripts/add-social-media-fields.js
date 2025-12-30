const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSocialMediaFields() {
  console.log('Adding social media fields to property_managers table...')

  try {
    // Check if columns exist by trying to select them
    const columns = ['instagram_url', 'facebook_url', 'linkedin_url', 'twitter_url']

    for (const column of columns) {
      const { error } = await supabase
        .from('property_managers')
        .select(column)
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        console.log(`Column ${column} does not exist, needs to be added via Supabase dashboard`)
      } else {
        console.log(`Column ${column} already exists or was added`)
      }
    }

    console.log('\nMigration check complete!')
    console.log('\nIf columns need to be added manually, run this SQL in Supabase dashboard:')
    console.log(`
      ALTER TABLE property_managers
      ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);

      ALTER TABLE property_managers
      ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);

      ALTER TABLE property_managers
      ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

      ALTER TABLE property_managers
      ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
    `)

  } catch (error) {
    console.error('Error during migration:', error)
  }
}

addSocialMediaFields()
