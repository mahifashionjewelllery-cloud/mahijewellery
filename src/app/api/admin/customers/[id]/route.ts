import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/supabase-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        // 1. Fetch user email from auth (admin only) - This is the source of truth for users
        const { data: { user: customerUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(id)

        if (userError || !customerUser) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // 2. Fetch user profile (might not exist)
        const { data: customerProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single()

        // 3. Fetch user orders
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        // 4. Calculate stats
        const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)

        const customer = {
            id: customerUser.id,
            name: customerProfile?.full_name || customerUser.user_metadata?.full_name || 'N/A',
            email: customerUser.email || 'N/A',
            phone: customerProfile?.phone || customerUser.phone || 'N/A',
            address: customerProfile?.address || 'N/A',
            joined: customerUser.created_at,
            totalOrders: orders.length,
            totalSpent: totalSpent
        }

        return NextResponse.json({ customer, orders })
    } catch (error: any) {
        console.error('Error fetching customer details:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
