#!/usr/bin/env node

// Seed Property Managers
// Adds sample property managers to the database

const { Client } = require('pg')

const connectionString = process.env.POSTGRES_URL_NON_POOLING ||
  'postgres://postgres.esdkkyekfnpmwifyohac:gLz8jvxZXhS5N1Is@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'

const propertyManagers = [
  {
    name: 'John Smith',
    email: 'john.smith@luxuryproperties.com',
    phone: '+1 (555) 123-4567'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@premiumrentals.com',
    phone: '+1 (555) 987-6543'
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@eliteproperties.com',
    phone: '+1 (555) 456-7890'
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@urbanmanagement.com',
    phone: '+1 (555) 321-0987'
  },
  {
    name: 'David Williams',
    email: 'david.williams@residentialgroup.com',
    phone: '+1 (555) 654-3210'
  },
  {
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@propertyexperts.com',
    phone: '+1 (555) 789-0123'
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@luxuryrentals.com',
    phone: '+1 (555) 234-5678'
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa.anderson@premiumhomes.com',
    phone: '+1 (555) 876-5432'
  }
]

async function seedPropertyManagers() {
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

    console.log('🌱 Seeding property managers...\n')

    let insertedCount = 0
    let skippedCount = 0

    for (const manager of propertyManagers) {
      try {
        const result = await client.query(
          `INSERT INTO property_managers (name, email, phone)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO NOTHING
           RETURNING id, name, email`,
          [manager.name, manager.email, manager.phone]
        )

        if (result.rowCount > 0) {
          console.log(`✅ Added: ${manager.name} (${manager.email})`)
          insertedCount++
        } else {
          console.log(`⏭️  Skipped: ${manager.email} (already exists)`)
          skippedCount++
        }
      } catch (err) {
        console.error(`❌ Failed to add ${manager.name}:`, err.message)
      }
    }

    console.log('\n📊 Summary:')
    console.log(`   ✅ Inserted: ${insertedCount}`)
    console.log(`   ⏭️  Skipped: ${skippedCount}`)
    console.log(`   📝 Total: ${propertyManagers.length}`)

    // Verify and show all property managers
    console.log('\n👥 All Property Managers in Database:\n')
    const allManagers = await client.query(
      'SELECT name, email, phone, created_at FROM property_managers ORDER BY created_at DESC'
    )

    allManagers.rows.forEach((manager, index) => {
      console.log(`${index + 1}. ${manager.name}`)
      console.log(`   📧 ${manager.email}`)
      console.log(`   📞 ${manager.phone}`)
      console.log(`   📅 Added: ${new Date(manager.created_at).toLocaleDateString()}\n`)
    })

    console.log(`\n🎉 Total property managers: ${allManagers.rows.length}`)
    console.log('\n✨ You can now:')
    console.log('1. Start your app: npm run dev')
    console.log('2. Go to: http://localhost:3000/admin/managers')
    console.log('3. View and manage your property managers\n')

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Disconnected')
  }
}

console.log('🌱 Property Manager Seeder\n')
console.log('==========================\n')

seedPropertyManagers().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
