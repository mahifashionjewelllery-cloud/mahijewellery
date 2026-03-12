import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/supabase-server'
import { uploadToCloudinary } from '@/lib/cloudinary'

// Admin Upload Route for Products - Bypasses RLS by using Service Role Key
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate User & Check Admin Role
        const { supabaseAdmin, error: authError, status } = await checkAdminAccess()
        if (authError || !supabaseAdmin) return NextResponse.json({ error: authError }, { status })

        // 2. Handle File
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // 3. Upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        try {
            const result: any = await uploadToCloudinary(buffer, 'anspares/products')
            return NextResponse.json({ url: result.secure_url })
        } catch (uploadError: any) {
            console.error('Cloudinary upload error:', uploadError)
            throw new Error(`Upload to Cloudinary failed: ${uploadError.message}`)
        }

    } catch (error: any) {
        console.error('Product upload error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
