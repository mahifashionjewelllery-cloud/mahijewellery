require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function makeAdmin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const email = 'mahifashionjewelllery@gmail.com';

  console.log(`Looking for user with email: ${email}`);
  
  // 1. Find user in auth.users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`User with email ${email} not found.`);
    return;
  }

  console.log(`User found. ID: ${user.id}`);

  // 2. Update role in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id)
    .select();

  if (error) {
    console.error('Error updating role:', error);
  } else {
    console.log(`Successfully updated role to admin for ${email}. Profile data:`, data);
  }
}

makeAdmin();
