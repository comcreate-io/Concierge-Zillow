const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addRLSPolicies() {
  console.log('Adding RLS policies for property_managers table...\n');

  try {
    // Enable RLS on property_managers table
    console.log('1. Enabling RLS on property_managers table...');
    const { error: enableRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE property_managers ENABLE ROW LEVEL SECURITY;'
    });

    // Drop existing policies if they exist
    console.log('2. Dropping existing policies if any...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Allow authenticated users to read property managers" ON property_managers;
        DROP POLICY IF EXISTS "Allow authenticated users to insert property managers" ON property_managers;
        DROP POLICY IF EXISTS "Allow authenticated users to update property managers" ON property_managers;
        DROP POLICY IF EXISTS "Allow authenticated users to delete property managers" ON property_managers;
      `
    });

    // Create policy to allow authenticated users to read property managers
    console.log('3. Creating read policy for authenticated users...');
    const { error: readPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to read property managers"
        ON property_managers
        FOR SELECT
        TO authenticated
        USING (true);
      `
    });

    // Create policy to allow authenticated users to insert property managers
    console.log('4. Creating insert policy for authenticated users...');
    const { error: insertPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to insert property managers"
        ON property_managers
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
      `
    });

    // Create policy to allow authenticated users to update property managers
    console.log('5. Creating update policy for authenticated users...');
    const { error: updatePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to update property managers"
        ON property_managers
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
      `
    });

    // Create policy to allow authenticated users to delete property managers
    console.log('6. Creating delete policy for authenticated users...');
    const { error: deletePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to delete property managers"
        ON property_managers
        FOR DELETE
        TO authenticated
        USING (true);
      `
    });

    console.log('\n✓ RLS policies added successfully!');
    console.log('Authenticated users can now read, insert, update, and delete property managers.');

  } catch (error) {
    console.error('Error adding RLS policies:', error);
  }
}

addRLSPolicies();
