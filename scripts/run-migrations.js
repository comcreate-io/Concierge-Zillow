#!/usr/bin/env node

// Direct PostgreSQL Migration Runner
// Connects to Supabase PostgreSQL and runs migrations

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Database connection string from .env
const connectionString = process.env.POSTGRES_URL_NON_POOLING ||
  'postgres://postgres.esdkkyekfnpmwifyohac:gLz8jvxZXhS5N1Is@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'

async function runMigrations() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false  // Accept self-signed certificates
    }
  })

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Connected successfully!\n')

    // Read all migration files
    const migrationsDir = path.join(__dirname, '../supabase/migrations')
    const files = fs.readdirSync(migrationsDir).sort()

    console.log(`📁 Found ${files.length} migration files\n`)

    for (const file of files) {
      if (!file.endsWith('.sql')) continue

      console.log(`📝 Running: ${file}`)
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')

      try {
        await client.query(sql)
        console.log(`✅ ${file} completed\n`)
      } catch (err) {
        console.error(`❌ ${file} failed:`, err.message)
        // Continue with other migrations
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...\n')

    const checkTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('properties', 'property_managers')
      ORDER BY table_name
    `)

    if (checkTables.rows.length === 2) {
      console.log('✅ properties table: EXISTS')
      console.log('✅ property_managers table: EXISTS\n')

      // Check columns
      const checkColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'property_managers'
        ORDER BY ordinal_position
      `)

      console.log('📋 property_managers columns:')
      checkColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })

      console.log('\n🎉 Database setup completed successfully!')
      console.log('\n✨ Next steps:')
      console.log('1. Start your app: npm run dev')
      console.log('2. Go to: http://localhost:3000/login')
      console.log('3. Sign up and add property managers\n')
    } else {
      console.log('⚠️  Tables created:', checkTables.rows.length, 'of 2')
      checkTables.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}`)
      })
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    console.error('\n💡 Troubleshooting:')
    console.error('1. Check your database password in .env.local')
    console.error('2. Verify your Supabase project is running')
    console.error('3. Check network connectivity\n')
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Disconnected from database')
  }
}

console.log('🚀 Supabase Database Setup\n')
console.log('=============================\n')

runMigrations().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
