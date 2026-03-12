import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is designed to be called by a cron job (like cron-job.org or Vercel Cron)
// to prevent the Supabase free tier database from pausing due to 7 days of inactivity.
export async function GET(request: Request) {
    try {
        // We use the service role key to ensure we can always connect
        // even if RLS is strict, just to make a simple ping query.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Perform a lightweight query to wake/keep-alive the database
        const { data, error } = await supabase
            .from('products')
            .select('id')
            .limit(1)

        if (error) {
            console.error('Keep-alive ping failed:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Database connection active and pinged successfully',
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        console.error('Keep-alive ping error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
