import { NextRequest, NextResponse } from 'next/server'
import { createServerAnonClient, checkAdminAccess } from '@/lib/supabase-server'

export async function GET() {
    try {
        const supabase = await createServerAnonClient()

        const { data, error } = await supabase
            .from('metal_rates')
            .select('*')
            .order('metal_type')
            .order('purity')

        if (error) throw error

        return NextResponse.json({ 
            rates: data || [],
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        console.error('Error fetching metal rates:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { supabaseAdmin, error: authError, status } = await checkAdminAccess()
        if (authError || !supabaseAdmin) {
            return NextResponse.json({ error: authError }, { status })
        }

        // Update the rate
        const { id, rate_per_gram } = await request.json()

        const { error } = await supabaseAdmin
            .from('metal_rates')
            .update({ 
                rate_per_gram,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating metal rate:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { supabaseAdmin, error: authError, status } = await checkAdminAccess()
        if (authError || !supabaseAdmin) {
            return NextResponse.json({ error: authError }, { status })
        }

        // Add new rate
        const { metal_type, purity, rate_per_gram } = await request.json()

        const { error } = await supabaseAdmin
            .from('metal_rates')
            .insert({ 
                metal_type, 
                purity, 
                rate_per_gram,
                updated_at: new Date().toISOString()
            })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error adding metal rate:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
