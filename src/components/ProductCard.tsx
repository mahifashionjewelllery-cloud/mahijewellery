'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Heart } from 'lucide-react'
import { Product } from '@/types'
import { calculateProductPrice, formatCurrency, cn } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { Button } from './ui/Button'
import { useState } from 'react'
import { useMetalRatesStore } from '@/store/metalRatesStore'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { getOptimizedImageUrl } from '@/lib/cloudinary-client'

interface ProductCardProps {
    product: Product
    showRemoveFromWishlist?: boolean
}

export function ProductCard({ product, showRemoveFromWishlist }: ProductCardProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const addToCart = useCartStore((state) => state.addItem)
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
    const { getRate } = useMetalRatesStore()
    
    const [isAdding, setIsAdding] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Dynamic rate based on product properties
    const currentRate = getRate(product.metal_type, product.purity)
    const priceDetails = calculateProductPrice(product, currentRate)

    const inWishlist = isInWishlist(product.id)
    
    const displayImage = product.image_url || product.images?.[0]
    const optimizedImage = displayImage ? getOptimizedImageUrl(displayImage, 600) : null

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault()

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            showToast('Please login to add items to cart', 'error')
            router.push('/login')
            return
        }

        setIsAdding(true)
        addToCart(product, priceDetails.total)
        showToast('Added to Cart', 'success')

        // Simulate feedback
        setTimeout(() => setIsAdding(false), 500)
    }

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault()
        
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            showToast('Please login to manage your wishlist', 'error')
            router.push('/login')
            return
        }

        if (inWishlist) {
            removeFromWishlist(product.id)
            showToast('Removed from Wishlist', 'success')
        } else {
            addToWishlist(product)
            showToast('Added to Wishlist', 'success')
        }
    }

    return (
        <div className="group relative bg-white rounded-[20px] overflow-hidden transition-all duration-500 border border-gray-100 hover:border-red-500/30 flex flex-col h-full shadow-md hover:shadow-xl">
            {/* Image Container */}
            <div className="p-2">
                <Link href={`/product/${product.id}`} className="block relative aspect-[4/3] overflow-hidden rounded-[16px] bg-gray-50">
                    {/* Image Skeleton */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gray-100 animate-pulse z-0" />
                    )}
                    
                    {optimizedImage ? (
                        <Image
                            src={optimizedImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className={cn(
                                "object-cover transition-transform duration-700 ease-out z-10",
                                imageLoaded ? "opacity-100 scale-100 group-hover:scale-105" : "opacity-0 scale-110"
                            )}
                            onLoad={() => setImageLoaded(true)}
                        />
                    ) : (
                        <div className="absolute z-10 inset-0 flex items-center justify-center text-gray-400 font-light italic">No Image</div>
                    )}
                    
                    {/* Wishlist Button Overlay */}
                    <button
                        onClick={toggleWishlist}
                        className={cn(
                            "absolute top-3 right-3 z-20 p-2 rounded-full transition-all duration-300",
                            "bg-white/90 backdrop-blur-sm border border-black/5 shadow-sm hover:bg-white",
                            inWishlist ? "text-red-500" : "text-gray-400 hover:text-red-500"
                        )}
                        aria-label={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        <Heart className={cn("h-4 w-4 transition-colors", inWishlist && "fill-red-500")} />
                    </button>
                    
                    {product.is_featured && (
                        <span className="absolute top-3 left-3 z-20 bg-red-500 text-white text-[8px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider shadow-md">
                            Featured
                        </span>
                    )}
                </Link>
            </div>

            <div className="px-4 pb-4 pt-2 flex flex-col flex-grow">
                <div className="mb-1">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {product.metal_type} • {product.purity}
                    </span>
                </div>
                
                <Link href={`/product/${product.id}`}>
                    <h3 className="font-sans text-base text-gray-900 font-semibold mb-1 line-clamp-1 group-hover:text-red-500 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-[#ff4d4d]">
                        {formatCurrency(priceDetails.total)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(priceDetails.total * 1.2)}
                    </span>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className={cn(
                            "flex-grow bg-[#ff4d4d] hover:bg-[#ff3333] text-white text-sm font-semibold h-11 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm hover:shadow-md",
                            isAdding && "opacity-80 scale-[0.98]"
                        )}
                    >
                        {isAdding ? "Adding..." : "Add to Cart"}
                    </button>

                    <button
                        onClick={() => router.push(`/product/${product.id}`)}
                        className="bg-white hover:bg-gray-50 text-gray-900 text-sm font-semibold h-11 px-4 rounded-xl border border-gray-200 transition-colors active:scale-[0.95]"
                    >
                        Buy
                    </button>
                </div>

                {showRemoveFromWishlist && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            removeFromWishlist(product.id);
                            showToast('Removed from Wishlist', 'success');
                        }}
                        className="mt-3 w-full py-2 bg-red-50 text-red-500 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-red-100 transition-colors border border-red-100"
                    >
                        Remove from Wishlist
                    </button>
                )}
            </div>
        </div>
    )
}
