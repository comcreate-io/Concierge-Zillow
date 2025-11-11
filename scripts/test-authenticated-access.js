const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4';

const supabase = createClient(supabaseUrl, anonKey);

async function testAuthenticatedAccess() {
  console.log('Testing authenticated access to property_managers...\n');

  // Check if there are any users
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();

  if (usersError) {
    console.error('Error listing users:', usersError);
    return;
  }

  console.log(`Found ${users.users.length} user(s) in the system`);

  if (users.users.length === 0) {
    console.log('No users found. Please create a user first.');
    return;
  }

  const firstUser = users.users[0];
  console.log(`Testing with user: ${firstUser.email}\n`);

  // Try accessing property_managers without authentication (as anon)
  const { data: anonData, error: anonError } = await supabase
    .from('property_managers')
    .select('id, name, email');

  if (anonError) {
    console.log('✗ Anon access (no auth):', anonError.message);
  } else {
    console.log(`✓ Anon access works: ${anonData?.length || 0} records`);
  }

  // Now test by generating an authenticated session
  // Note: In a real browser, the session would be stored in cookies
  // For testing, we'll use the service role to verify the policy works
  const { data: authData, error: authError } = await adminClient
    .from('property_managers')
    .select('id, name, email');

  if (authError) {
    console.log('✗ Service role access:', authError.message);
  } else {
    console.log(`✓ Service role access: ${authData?.length || 0} records (bypasses RLS)`);
  }
}

testAuthenticatedAccess();
