const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addManagerProfileFields() {
  console.log('Adding last_name and title fields to property_managers table...')

  try {
    // Add last_name column
    const { error: lastNameError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE property_managers
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
      `
    })

    if (lastNameError) {
      // Try direct SQL if RPC doesn't exist
      console.log('Trying direct approach for last_name...')
      const { error } = await supabase
        .from('property_managers')
        .select('last_name')
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        console.log('Column last_name does not exist, needs to be added via Supabase dashboard')
      } else {
        console.log('Column last_name already exists or was added')
      }
    }

    // Add title column
    const { error: titleError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE property_managers
        ADD COLUMN IF NOT EXISTS title VARCHAR(255);
      `
    })

    if (titleError) {
      // Try direct SQL if RPC doesn't exist
      console.log('Trying direct approach for title...')
      const { error } = await supabase
        .from('property_managers')
        .select('title')
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        console.log('Column title does not exist, needs to be added via Supabase dashboard')
      } else {
        console.log('Column title already exists or was added')
      }
    }

    console.log('\nMigration check complete!')
    console.log('\nIf columns need to be added manually, run this SQL in Supabase dashboard:')
    console.log(`
      ALTER TABLE property_managers
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

      ALTER TABLE property_managers
      ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    `)

  } catch (error) {
    console.error('Error during migration:', error)
  }
}

addManagerProfileFields()
