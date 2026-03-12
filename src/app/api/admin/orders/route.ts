import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/supabase-server'

export async function GET() {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        // Fetch orders raw (no join)
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        // Extract user IDs to fetch profiles
        const userIds = Array.from(new Set(orders.map(o => o.user_id).filter(Boolean)))

        let profiles: any[] = []
        if (userIds.length > 0) {
            const { data: profilesData } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, phone')
                .in('id', userIds)
            if (profilesData) profiles = profilesData
        }

        // Helper function to map user ID to email using Service Role
        // For 2 users, this is fine. For 1000, maybe pagination needed, but standard listUsers returns 50 per page?
        // listUsers() without params returns first 50.
        // We might miss users if we have > 50.
        // But for now, let's keep simple.
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

        const enrichedOrders = orders.map(order => {
            const profile = profiles.find(p => p.id === order.user_id)
            const user = users?.find(u => u.id === order.user_id)

            // Extract name from shipping address (stored on first line) if profile name is missing
            const shippingName = order.shipping_address ? order.shipping_address.split('\n')[0] : null
            const finalName = profile?.full_name || shippingName || 'Guest User'

            return {
                ...order,
                customer_name: finalName,
                customer_email: user?.email || 'N/A',
                customer_phone: profile?.phone || 'N/A'
            }
        })

        return NextResponse.json({ orders: enrichedOrders })

    } catch (error: any) {
        console.error('Error fetching admin orders:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        const { id, status: newStatus } = await request.json()

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ order_status: status })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('id')

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        const { error: deleteError } = await supabaseAdmin
            .from('orders')
            .delete()
            .eq('id', orderId)

        if (deleteError) {
            throw deleteError
        }

        return NextResponse.json({ success: true, message: 'Order deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting order:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
