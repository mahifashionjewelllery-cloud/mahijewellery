'use client'

import { useWishlistStore } from '@/store/wishlistStore'
import { ProductCard } from '@/components/ProductCard'
import { Heart, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function WishlistPage() {
    const { items, isLoading, fetchWishlist, hasHydrated } = useWishlistStore()
    const router = useRouter()
    const [checkingAuth, setCheckingAuth] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login?redirect=/wishlist')
            } else {
                setCheckingAuth(false)
                // Sync on mount if authenticated and hydrated
                if (hasHydrated && !isLoading) {
                    fetchWishlist()
                }
            }
        }
        checkAuth()
    }, [hasHydrated, router])

    return (
        <div className="bg-background min-h-screen py-10 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-white/10">
                    <div>
                        <Link href="/shop" className="inline-flex items-center text-sm text-emerald-50/70 hover:text-white mb-6 transition-colors">
                            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Shop
                        </Link>
                        <div className="flex items-center gap-3">
                            <Heart className="h-8 w-8 text-red-500 fill-red-500/20" />
                            <h1 className="font-serif text-3xl lg:text-4xl text-white">My Wishlist</h1>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <p className="text-emerald-50/70 mt-4 md:mt-0">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
                    )}
                </div>

                {checkingAuth ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                    </div>
                ) : (isLoading && items.length === 0) ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                    </div>
                ) : items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                        {items.map((product) => (
                            <ProductCard key={product.id} product={product} showRemoveFromWishlist={true} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-lg border border-dashed border-white/20 py-24 text-center max-w-2xl mx-auto backdrop-blur-sm">
                        <Heart className="h-16 w-16 mx-auto text-emerald-100/20 mb-6" />
                        <h2 className="font-serif text-2xl text-white mb-4">Your wishlist is empty</h2>
                        <p className="text-emerald-50/70 mb-8 max-w-md mx-auto">
                            It seems you haven't added any items to your wishlist yet. Explore our collections to find your perfect match.
                        </p>
                        <Link href="/shop">
                            <Button size="lg" className="min-w-[200px] bg-accent text-emerald-950 hover:bg-white transition-colors">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
