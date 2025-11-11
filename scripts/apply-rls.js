const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.esdkkyekfnpmwifyohac',
  password: 'gLz8jvxZXhS5N1Is',
  ssl: { rejectUnauthorized: false }
});

async function applyRLS() {
  try {
    console.log('Connecting to database...\n');

    const sql = fs.readFileSync(path.join(__dirname, '..', 'add-rls-policies.sql'), 'utf8');

    console.log('Applying RLS policies...\n');
    await pool.query(sql);

    console.log('✓ RLS policies applied successfully!\n');

    // Verify the policies were created
    console.log('Verifying policies...');
    const result = await pool.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd
      FROM pg_policies
      WHERE tablename IN ('property_managers', 'property_manager_assignments')
      ORDER BY tablename, policyname;
    `);

    console.log(`\nFound ${result.rows.length} policies:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.policyname} (${row.cmd})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

applyRLS();
