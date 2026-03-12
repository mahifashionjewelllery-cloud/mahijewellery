import { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Server-side fetch for metadata
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() { /* noop */ }
        }
    })

    const { data: product } = await supabase
        .from('products')
        .select('name, description')
        .eq('id', id)
        .single()

    if (!product) {
        return {
            title: 'Product Not Found | Mahi Fashion Jewellery',
        }
    }

    return {
        title: `${product.name} | Mahi Fashion Jewellery`,
        description: product.description?.substring(0, 160) || 'Discover timeless elegance with this piece.',
    }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
