import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/supabase-server'

export async function GET() {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        const { data: messages, error: fetchError } = await supabaseAdmin
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        return NextResponse.json({ messages })
    } catch (error: any) {
        console.error('Error fetching messages:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { supabaseAdmin, error, status } = await checkAdminAccess()
        if (error || !supabaseAdmin) return NextResponse.json({ error }, { status })

        const { searchParams } = new URL(request.url)
        const messageId = searchParams.get('id')

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
        }

        const { error: deleteError } = await supabaseAdmin
            .from('contact_messages')
            .delete()
            .eq('id', messageId)

        if (deleteError) {
            throw deleteError
        }

        return NextResponse.json({ success: true, message: 'Message deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting message:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
