import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/supabase-server'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

// Admin Upload Route - Bypasses RLS by using Service Role Key
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
            const result: any = await uploadToCloudinary(buffer, 'anspares/gallery')
            return NextResponse.json({ url: result.secure_url })
        } catch (uploadError: any) {
            console.error('Cloudinary upload error:', uploadError)
            throw new Error(`Upload to Cloudinary failed: ${uploadError.message}`)
        }

    } catch (error: any) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // 1. Authenticate User & Check Admin Role
        const { supabaseAdmin, error: authError, status } = await checkAdminAccess()
        if (authError || !supabaseAdmin) return NextResponse.json({ error: authError }, { status })

        // 2. Get URL or Public ID to delete
        const { url, publicId } = await request.json()
        if (!url && !publicId) {
            return NextResponse.json({ error: 'URL or publicId required' }, { status: 400 })
        }

        let idToDelete = publicId;

        if (!idToDelete && url) {
            // Extract public ID from Cloudinary URL
            // Example: https://res.cloudinary.com/cloud-name/image/upload/v12345/folder/public_id.jpg
            const parts = url.split('/upload/');
            if (parts.length === 2) {
                const subParts = parts[1].split('/');
                // Remove version (starts with 'v') if present
                if (subParts[0].startsWith('v')) {
                    subParts.shift();
                }
                const pathWithExtension = subParts.join('/');
                idToDelete = pathWithExtension.split('.')[0];
            }
        }

        if (!idToDelete) {
            return NextResponse.json({ error: 'Could not extract public ID from URL' }, { status: 400 })
        }

        // 3. Delete from Cloudinary
        const result = await deleteFromCloudinary(idToDelete);

        if (result.result !== 'ok') {
            throw new Error(`Cloudinary delete failed: ${result.result}`)
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
