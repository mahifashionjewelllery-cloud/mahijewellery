require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
    console.log('🔍 Checking profiles table...')
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*')
    if (profileErr) {
        console.log('Error profiles:', profileErr.message)
    } else {
        console.log('Profiles:', profiles)
    }

    console.log('\n🔍 Checking auth users...')
    const { data: users, error: authErr } = await supabase.auth.admin.listUsers()
    if (authErr) {
        console.log('Error auth:', authErr.message)
    } else {
        console.log('Users:', users.users.map(u => ({ id: u.id, email: u.email, role: u.role })))
    }
}

checkUsers()
