require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Just fetch a random user to try to delete
  const { data } = await supabase.auth.admin.listUsers();
  if (data.users.length < 2) {
    console.log("Not enough users to test deletion safely.");
    return;
  }
  
  // Try to delete a test user if one exists, otherwise don't accidentally delete admin
  const userToDelete = data.users.find(u => u.email !== 'mahifashionjewelllery@gmail.com');
  
  if (userToDelete) {
     console.log(`Attempting to delete user ${userToDelete.email} (${userToDelete.id})...`);
     const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);
     console.log("Result:", error ? error.message : "Success");
  } else {
     console.log("No non-admin users found.");
  }
}

test();
