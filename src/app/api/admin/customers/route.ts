import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/supabase-server'

export async function GET() {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        // 1. Fetch all users to get their emails (admin only feature)
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
        if (usersError) throw usersError

        // 2. Fetch all profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('*')
        if (profilesError) throw profilesError

        // 3. Fetch all orders to calculate stats
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('user_id, total_amount')
        if (ordersError) throw ordersError

        // 4. Combine data (Base it on auth.users rather than profiles to ensure no missing users if profile failed to create)
        const customers = users.map(user => {
            const profile = profiles.find(p => p.id === user.id)

            const userOrders = orders.filter(o => o.user_id === user.id)
            const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)

            return {
                id: user.id,
                name: profile?.full_name || user.user_metadata?.full_name || 'N/A',
                email: user.email || 'N/A',
                phone: profile?.phone || user.phone || 'N/A',
                joined: user.created_at,
                totalOrders: userOrders.length,
                totalSpent: totalSpent,
                role: profile?.role || 'user'
            }
        })

        return NextResponse.json({ customers })
    } catch (error: any) {
        console.error('Error fetching customers:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('id')

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Check if the target user is an admin
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single()
        if (profile?.role === 'admin') {
            return NextResponse.json({ error: 'Cannot delete an administrator account' }, { status: 403 })
        }

        // Delete from auth.users (Supabase cascade deletes the profile because of foreign key setup)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            throw deleteError
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
