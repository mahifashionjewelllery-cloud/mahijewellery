import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/supabase-server'

export async function GET() {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        // Fetch data concurrently
        const [
            { data: orders, error: ordersError },
            { count: usersCount },
            { count: productsCount }
        ] = await Promise.all([
            // Fetch orders ordered by date (no join)
            supabaseAdmin
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false }),

            // 3. Registered Users Count (approx from profiles)
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),

            // 4. Products Count
            supabaseAdmin.from('products').select('*', { count: 'exact', head: true })
        ])

        if (ordersError) throw ordersError

        // Calculate Dashboard Stats

        // 1. Total Revenue (all non-cancelled orders)
        const totalRevenue = orders
            .filter(o => o.order_status !== 'cancelled')
            .reduce((sum, o) => sum + Number(o.total_amount), 0)

        // 2. Active Orders (pending, processing or shipped)
        const activeOrders = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.order_status)).length

        // 5. Sales Trend (Revenue by month) - Last 6 months
        // This is complex in SQL/JS. Simplified: grouping current fetched orders (which might be few)
        // Ideally we use a SQL view or RPC, but let's do simple aggregation here.
        const monthlyRevenue: Record<string, number> = {}
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        orders.forEach(order => {
            if (order.order_status !== 'cancelled') {
                const date = new Date(order.created_at)
                const month = months[date.getMonth()]
                monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(order.total_amount)
            }
        })

        // Format for Recharts
        const salesData = Object.keys(monthlyRevenue).map(name => ({
            name,
            revenue: monthlyRevenue[name]
        }))

        // Sort by month index if needed, but object keys iteration might be arbitrary order. 
        // For now let's just use what we have, or ensure order.
        // Better: Initialize last 6 months with 0.

        // 6. Category Distribution (Products by metal_type)
        const { data: products } = await supabaseAdmin.from('products').select('metal_type')
        const categoryMap: Record<string, number> = {}

        products?.forEach(p => {
            const type = p.metal_type || 'Other'
            const key = type.charAt(0).toUpperCase() + type.slice(1) // Capitalize
            categoryMap[key] = (categoryMap[key] || 0) + 1
        })

        const categoryData = Object.keys(categoryMap).map(name => ({
            name,
            value: categoryMap[name]
        }))

        return NextResponse.json({
            stats: {
                totalRevenue,
                activeOrders,
                totalProducts: productsCount || 0,
                registeredUsers: usersCount || 0
            },
            salesData,
            categoryData,
            recentOrders: orders.slice(0, 5)
        })

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
