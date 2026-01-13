#!/usr/bin/env node

// Migration: Add agent info columns to properties table
// Run with: node scripts/add-agent-info-columns.js

// Fix SSL certificate issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const { Client } = require('pg')

const connectionString = process.env.POSTGRES_URL_NON_POOLING ||
  'postgres://postgres.esdkkyekfnpmwifyohac:gLz8jvxZXhS5N1Is@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'

const migration = `
-- Add agent info columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS agent_name TEXT NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS agent_phone TEXT NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS agent_email TEXT NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS broker_name TEXT NULL;

-- Add index for agent lookups (optional, for future features)
CREATE INDEX IF NOT EXISTS idx_properties_agent_name ON public.properties USING btree (agent_name);
`

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('📝 Adding agent info columns to properties table...')
    await client.query(migration)
    console.log('✅ Migration completed successfully!\n')

    // Verify columns were added
    const { rows } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name IN ('agent_name', 'agent_phone', 'agent_email', 'broker_name')
      ORDER BY column_name
    `)

    console.log('📋 New columns added:')
    rows.forEach(row => {
      console.log(`   ✅ ${row.column_name} (${row.data_type})`)
    })

    console.log('\n🎉 Agent info columns added successfully!')
    console.log('Properties can now store: agent_name, agent_phone, agent_email, broker_name')

  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Disconnected from database')
  }
}

console.log('🚀 Agent Info Columns Migration\n')
console.log('================================\n')

runMigration().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
