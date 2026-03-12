import { NextRequest, NextResponse } from 'next/server'
import { createServerAnonClient, checkAdminAccess } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function GET() {
    try {
        const supabase = await createServerAnonClient()

        const { data, error } = await supabase
            .from('site_settings')
            .select('*')

        if (error) throw error

        return NextResponse.json({ settings: data || [] })
    } catch (error: any) {
        console.error('Error fetching site settings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { supabaseAdmin, error: authError, status } = await checkAdminAccess()
        if (authError || !supabaseAdmin) {
            return NextResponse.json({ error: authError }, { status })
        }

        const { key, value } = await request.json()

        const { error } = await supabaseAdmin
            .from('site_settings')
            .upsert({ 
                key, 
                value,
                updated_at: new Date().toISOString()
            })

        if (error) throw error

        revalidatePath('/')
        revalidatePath('/gallery')

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating site setting:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
