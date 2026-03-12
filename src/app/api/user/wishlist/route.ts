import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { /* noop */ }
            }
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('wishlists')
            .select(`
                product_id,
                products (
                    *,
                    product_images(image_url)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Transform data to match Product type
        const formattedWishlist = data.map((item: any) => {
            const product = item.products
            return {
                ...product,
                images: product.product_images?.map((img: any) => img.image_url) || []
            }
        })

        return NextResponse.json(formattedWishlist)
    } catch (error: any) {
        console.error('Wishlist GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { /* noop */ }
            }
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { productId } = await request.json()

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('wishlists')
            .insert({
                user_id: user.id,
                product_id: productId
            })
            .select()
            .single()

        if (error) {
            // Handle unique constraint violation gracefully (already in wishlist)
            if (error.code === '23505') {
                 return NextResponse.json({ success: true, message: 'Already in wishlist' })
            }
            throw error
        }

        return NextResponse.json({ success: true, item: data })
    } catch (error: any) {
        console.error('Wishlist POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { /* noop */ }
            }
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Wishlist DELETE Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
