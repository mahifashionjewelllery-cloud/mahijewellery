const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function ping() {
  console.log('Pinging Supabase to keep it alive...');
  const { data, error } = await supabase.from('site_settings').select('*').limit(1);
  if (error) {
    console.error('Error pinging Supabase:', error);
  } else {
    console.log('Ping successful:', data);
  }
}

ping();
