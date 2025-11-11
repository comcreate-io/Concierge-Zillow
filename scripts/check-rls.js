const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('Checking RLS policies...\n');

  // Try direct query to check table structure
  const { data: tableInfo, error: tableError } = await supabase
    .from('property_managers')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('Error querying property_managers with service role:', tableError);
  } else {
    console.log('✓ Service role can query property_managers table');
  }

  // Test with anon key
  const anonClient = createClient(
    supabaseUrl,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'
  );

  const { data: anonData, error: anonError } = await anonClient
    .from('property_managers')
    .select('id, name, email');

  if (anonError) {
    console.error('✗ Anon key CANNOT access property_managers:', anonError.message);
    console.error('This is likely an RLS policy issue!\n');
  } else {
    console.log(`✓ Anon key CAN access property_managers: ${anonData?.length || 0} records`);
  }
}

checkRLS();
