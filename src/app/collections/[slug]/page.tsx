'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function CollectionDetailPage() {
    const params = useParams()
    const slug = params.slug as string
    
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    const collectionName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

    useEffect(() => {
        const fetchCollectionProducts = async () => {
            try {
                setLoading(true)
                const supabase = createClient()
                
                // 1. Fetch the collection record by its link (slug)
                const { data: collectionData, error: collectionError } = await supabase
                    .from('collections')
                    .select('id, name')
                    .filter('link', 'ilike', `%${slug}%`)
                    .single()

                if (collectionError) {
                    console.warn("Collection not found in DB, falling back to name matching", collectionError)
                }

                // 2. Fetch products
                let query = supabase
                    .from('products')
                    .select('*, product_images(image_url)')

                if (collectionData?.id) {
                    // Match by collection_id OR name matching as fallback
                    query = query.or(`collection_id.eq.${collectionData.id},name.ilike.%${collectionName}%,description.ilike.%${collectionName}%`)
                } else {
                    // Fallback to name/description matching only
                    query = query.or(`name.ilike.%${collectionName}%,description.ilike.%${collectionName}%`)
                }

                const { data, error } = await query

                if (error) throw error

                if (data) {
                    const productsWithImages = data.map(product => ({
                        ...product,
                        images: product.product_images?.map((img: any) => img.image_url) || []
                    }))
                    setProducts(productsWithImages)
                }
            } catch (err) {
                console.error("Error fetching collection:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchCollectionProducts()
    }, [slug, collectionName])

    if (loading) {
        return (
            <div className="bg-background min-h-screen py-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900"></div>
            </div>
        )
    }

    return (
        <div className="bg-background min-h-screen py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-16">
                    <Link href="/shop" className="group inline-flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-emerald-900 mb-10 transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Collection
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <span className="block text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-4">Mahi Signature Series</span>
                            <h1 className="font-serif text-5xl md:text-7xl text-emerald-950 mb-4 tracking-tighter">{collectionName}</h1>
                            <p className="text-emerald-800/60 text-lg font-light italic max-w-2xl">Discover the artistry and heritage behind our exclusive {collectionName.toLowerCase()} pieces, crafted for moments that matter.</p>
                        </div>
                    </div>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <h3 className="font-serif text-2xl text-emerald-950 mb-2">Coming Soon</h3>
                        <p className="text-gray-500 mb-6">Create new memories with our upcoming {collectionName} designs.</p>
                        <Link href="/shop">
                            <Button variant="outline">Browse all products</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
