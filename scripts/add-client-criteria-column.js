// Migration script to add criteria column to clients table
// Run with: node scripts/add-client-criteria-column.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addClientCriteriaColumn() {
  console.log('Adding criteria column to clients table...')

  const alterTableSQL = `
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS criteria TEXT;
  `

  // We can't run raw SQL directly with the JS client, so we'll check if the column exists
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error checking table:', error.message)
    console.log('\nPlease run this SQL in your Supabase SQL Editor:')
    console.log(alterTableSQL)
    return
  }

  // Check if column already exists
  if (data && data[0] && 'criteria' in data[0]) {
    console.log('Criteria column already exists!')
    return
  }

  console.log('\nThe criteria column needs to be added. Please run this SQL in your Supabase SQL Editor:\n')
  console.log('--------------------------------------------------')
  console.log(alterTableSQL)
  console.log('--------------------------------------------------')
  console.log('\nAfter running the SQL, the clients table will have:')
  console.log('- criteria (text, nullable)')
  console.log('\nThis column stores what the client is looking for (bedrooms, budget, move-in date, location preferences, etc.).')
}

addClientCriteriaColumn()
