'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useMetalRatesStore } from '@/store/metalRatesStore'
import { calculateProductPrice, formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/ProductCard'
import { ShoppingBag, Star, HelpCircle, ArrowLeft, Heart, Maximize2, X, Plus, Minus, ChevronDown, ShieldCheck, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useWishlistStore } from '@/store/wishlistStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { getOptimizedImageUrl } from '@/lib/cloudinary-client'

export default function ProductDetailPage() {
    const params = useParams()
    const id = params.id as string

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [quantity, setQuantity] = useState(1)
    const [activeAccordion, setActiveAccordion] = useState<string | null>('details')

    const addToCart = useCartStore((state) => state.addItem)
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
    const { getRate } = useMetalRatesStore()
    const router = useRouter()
    const { showToast } = useToast()

    useEffect(() => {
        fetchProduct()
    }, [id])

    useEffect(() => {
        if (product) {
            document.title = `${product.name} | Mahi Fashion Jewellery`
        }
    }, [product])

    const fetchProduct = async () => {
        try {
            setLoading(true)
            const supabase = createClient()

            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_images(image_url)
                `)
                .eq('id', id)
                .single()

            if (error) throw error

            const productWithImages = {
                ...data,
                images: data.product_images?.map((img: any) => img.image_url) || []
            }
            
            // Prefer the main image_url if it exists
            const mainImg = data.image_url || productWithImages.images[0]
            if (mainImg) setSelectedImage(mainImg)

            setProduct(productWithImages)
            
            // Fetch related products
            if (data) {
                const { data: relatedData } = await supabase
                    .from('products')
                    .select(`*, product_images(image_url)`)
                    .eq('metal_type', data.metal_type)
                    .neq('id', id)
                    .limit(4)
                    
                if (relatedData) {
                    setRelatedProducts(relatedData.map(p => ({
                        ...p,
                        images: p.product_images?.map((img: any) => img.image_url) || []
                    })))
                }
            }

        } catch (err: any) {
            console.error('Error fetching product:', err)
            setError('Product not found')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900"></div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <h2 className="text-2xl font-serif text-emerald-900 mb-4">Product Not Found</h2>
                <Link href="/shop">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
                    </Button>
                </Link>
            </div>
        )
    }

    // Rate logic - Dynamic
    const metalRate = getRate(product.metal_type, product.purity)
    const priceDetails = calculateProductPrice(product, metalRate)

    const inWishlist = product ? isInWishlist(product.id) : false

    const handleAddToCart = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            showToast('Please login to add items to cart', 'error')
            router.push('/login')
            return
        }

        setIsAdding(true)
        addToCart(product, priceDetails.total, quantity)
        showToast('Added to Cart', 'success')
        setTimeout(() => setIsAdding(false), 500)
    }

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!product) return;

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
        <div className="bg-background min-h-screen py-6 lg:py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Link href="/shop" className="inline-flex items-center text-sm text-emerald-100 hover:text-emerald-50 mb-6 transition-colors">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Collection
                    </Link>
                </motion.div>

                <div className="flex flex-col">

                    {/* Image Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="w-full relative z-10"
                    >
                        <div className="aspect-square sm:aspect-video md:aspect-[4/3] relative rounded-t-[32px] overflow-hidden bg-emerald-950/20 group cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
                            {product.images && product.images.length > 0 ? (
                                <>
                                    <Image
                                        src={getOptimizedImageUrl(selectedImage || product.images[0], 800)}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        priority
                                    />
                                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                        <Maximize2 className="h-4 w-4 text-emerald-950" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                                    <ShoppingBag className="h-16 w-16 opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 p-4 bg-background">
                                {product.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(img)}
                                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border transition-all ${(selectedImage === img || (!selectedImage && index === 0))
                                            ? 'border-accent ring-1 ring-accent opacity-100'
                                            : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                                            }`}
                                    >
                                        <Image
                                            src={getOptimizedImageUrl(img, 200)}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Details Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="bg-white rounded-b-[32px] p-6 sm:p-10 shadow-2xl relative z-20 -mt-2 sm:-mt-6"
                    >
                        <div className="mb-4 flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-accent px-3 py-1 bg-accent/10 rounded-full uppercase tracking-widest">{product.metal_type}</span>
                            <span className="text-gray-200">|</span>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-tighter">{product.purity} Purity</span>
                            <span className="text-gray-200">|</span>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-tighter">{product.weight}g Net Weight</span>
                        </div>

                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-emerald-950 mb-6 tracking-tight leading-tight">{product.name}</h1>

                        <p className="text-gray-600 text-lg leading-relaxed mb-10 font-light italic">
                            {product.description}
                        </p>

                        <div className="glass-premium p-8 rounded-2xl mb-10 border border-emerald-900/5 shadow-premium overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transform group-hover:scale-110 transition-transform duration-1000">
                                <ShoppingBag className="h-32 w-32 text-emerald-900" />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 border-b border-emerald-900/10 pb-6 relative z-10">
                                <div>
                                    <span className="block text-xs text-emerald-800 font-bold uppercase tracking-[0.2em] mb-2">Final Estimated Price</span>
                                    <span className="font-serif text-4xl sm:text-5xl font-bold text-emerald-950 text-glow">{formatCurrency(priceDetails.total)}</span>
                                </div>
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-4 sm:mt-0 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full w-fit shadow-sm border border-emerald-100">
                                    Inclusive of 3% GST
                                </span>
                            </div>
                            
                            <div className="text-sm text-emerald-800/80 space-y-4 relative z-10">
                                <h4 className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-[0.3em] mb-4">Price Breakdown Analysis</h4>
                                
                                <div className="flex justify-between items-center group">
                                    <span className="border-b border-dashed border-emerald-900/20 w-fit font-medium">Market Metal Cost</span>
                                    <span className="font-serif font-bold text-lg text-emerald-950">{formatCurrency(priceDetails.breakdown.metalPrice)}</span>
                                </div>
                                <div className="pl-4 text-[10px] text-emerald-600/70 font-bold tracking-wider uppercase">
                                    {product.weight}g × {formatCurrency(metalRate)} / gram
                                </div>

                                <div className="flex justify-between items-center pt-2 group">
                                    <span className="border-b border-dashed border-emerald-900/20 w-fit font-medium">Artisanal Making Charges</span>
                                    <span className="font-serif font-bold text-lg text-emerald-950">{formatCurrency(priceDetails.breakdown.makingCharges)}</span>
                                </div>
                                <div className="pl-4 text-[10px] text-emerald-600/70 font-bold tracking-wider uppercase">
                                    {product.making_charge_type === 'percentage' 
                                        ? `${product.making_charge_value}% Craftsmanship Fee` 
                                        : `Signature Fixed Charge`
                                    }
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-emerald-900/10 mt-4">
                                    <span className="font-bold text-xs uppercase tracking-widest">Subtotal Value</span>
                                    <span className="font-serif font-bold text-xl text-emerald-950">{formatCurrency(priceDetails.breakdown.metalPrice + priceDetails.breakdown.makingCharges)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-1 group">
                                    <span className="border-b border-dashed border-emerald-900/20 w-fit font-medium">Government Tax (GST 3%)</span>
                                    <span className="font-serif font-bold text-lg text-emerald-950">{formatCurrency(priceDetails.breakdown.gst)}</span>
                                </div>

                                <div className="pt-6 text-center text-[10px] opacity-60 font-medium uppercase tracking-[0.2em] text-emerald-700">
                                    * Reflects live {product.metal_type} market valuation.
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex gap-4 w-full sm:w-auto">
                                <div className="flex items-center border border-emerald-900/10 rounded-2xl bg-white shadow-sm h-16 flex-1 sm:flex-none justify-between px-2">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 text-emerald-800 hover:bg-emerald-50 transition-all rounded-xl flex items-center justify-center active:scale-95">
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-10 text-center font-serif text-xl font-bold text-emerald-950">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 text-emerald-800 hover:bg-emerald-50 transition-all rounded-xl flex items-center justify-center active:scale-95">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                <Button 
                                    variant="outline" 
                                    size="lg" 
                                    className="sm:hidden h-16 w-16 px-0 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center border-emerald-900/10 shrink-0 shadow-sm active:scale-95"
                                    onClick={toggleWishlist}
                                >
                                    <Heart className={cn("h-6 w-6 transition-colors", inWishlist ? "fill-red-500 text-red-500" : "text-emerald-900/40")} />
                                </Button>
                            </div>
                            
                            <Button
                                size="lg"
                                className="flex-1 text-lg h-16 rounded-2xl shadow-accent hover:shadow-2xl transition-all font-bold tracking-widest bg-accent text-emerald-950 hover:bg-emerald-950 hover:text-white uppercase active:scale-[0.98]"
                                onClick={handleAddToCart}
                            >
                                <ShoppingBag className="mr-3 h-6 w-6 shrink-0" />
                                <span className="truncate">
                                    {isAdding ? 'Securing for Cart...' : `Reserve for ${formatCurrency(priceDetails.total * quantity)}`}
                                </span>
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="hidden sm:flex h-16 px-6 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all items-center justify-center border-emerald-100 shrink-0 shadow-sm active:scale-95"
                                onClick={toggleWishlist}
                            >
                                <Heart className={cn("h-6 w-6 transition-colors", inWishlist ? "fill-red-500 text-red-500" : "text-emerald-900/40")} />
                            </Button>
                        </div>

                        {/* Expandable Info Accordions */}
                        <div className="mt-10 space-y-3 border-t border-emerald-900/10 pt-8">
                            {/* Details Accordion */}
                            <div className="border border-emerald-900/5 rounded-lg overflow-hidden">
                                <button 
                                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-emerald-50/50 transition-colors"
                                    onClick={() => setActiveAccordion(activeAccordion === 'details' ? null : 'details')}
                                >
                                    <div className="flex items-center gap-3 text-emerald-950 font-medium tracking-wide">
                                        <HelpCircle className="h-5 w-5 text-emerald-700" />
                                        <span>Product Specifications</span>
                                    </div>
                                    <ChevronDown className={cn("h-4 w-4 text-emerald-800 transition-transform duration-300", activeAccordion === 'details' && "rotate-180")} />
                                </button>
                                <AnimatePresence>
                                    {activeAccordion === 'details' && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="p-4 bg-white border-t border-emerald-900/5 text-sm text-gray-600 space-y-3">
                                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                                    <span className="text-gray-500">Metal Type</span>
                                                    <span className="font-medium text-gray-900">{product.metal_type}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                                    <span className="text-gray-500">Purity</span>
                                                    <span className="font-medium text-gray-900">{product.purity}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                                    <span className="text-gray-500">Net Weight</span>
                                                    <span className="font-medium text-gray-900">{product.weight}g</span>
                                                </div>
                                                <div className="flex justify-between pb-1">
                                                    <span className="text-gray-500">Collection ID</span>
                                                    <span className="font-medium text-gray-900 uppercase">{product.collection_id || 'Signature'}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Shipping Accordion */}
                            <div className="border border-emerald-900/5 rounded-lg overflow-hidden">
                                <button 
                                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-emerald-50/50 transition-colors"
                                    onClick={() => setActiveAccordion(activeAccordion === 'shipping' ? null : 'shipping')}
                                >
                                    <div className="flex items-center gap-3 text-emerald-950 font-medium tracking-wide">
                                        <Truck className="h-5 w-5 text-emerald-700" />
                                        <span>Shipping & Returns</span>
                                    </div>
                                    <ChevronDown className={cn("h-4 w-4 text-emerald-800 transition-transform duration-300", activeAccordion === 'shipping' && "rotate-180")} />
                                </button>
                                <AnimatePresence>
                                    {activeAccordion === 'shipping' && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="p-4 bg-white border-t border-emerald-900/5 text-sm text-gray-600 space-y-2 leading-relaxed">
                                                <p>• Free, fully insured shipping across kanyakumari.</p>
                                                <p>• Delivery normally takes 3-5 business days upon dispatch.</p>
                                                <p>• 15-day hassle-free return policy for unused items in original packaging.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Care Accordion */}
                            <div className="border border-emerald-900/5 rounded-lg overflow-hidden">
                                <button 
                                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-emerald-50/50 transition-colors"
                                    onClick={() => setActiveAccordion(activeAccordion === 'care' ? null : 'care')}
                                >
                                    <div className="flex items-center gap-3 text-emerald-950 font-medium tracking-wide">
                                        <ShieldCheck className="h-5 w-5 text-emerald-700" />
                                        <span>Jewellery Care</span>
                                    </div>
                                    <ChevronDown className={cn("h-4 w-4 text-emerald-800 transition-transform duration-300", activeAccordion === 'care' && "rotate-180")} />
                                </button>
                                <AnimatePresence>
                                    {activeAccordion === 'care' && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="p-4 bg-white border-t border-emerald-900/5 text-sm text-gray-600 space-y-2 leading-relaxed">
                                                <p>• Store in a cool, dry place away from direct sunlight.</p>
                                                <p>• Keep separated in a pouch or box to avoid scratches.</p>
                                                <p>• Avoid direct contact with perfumes, lotions, and harsh chemicals.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100">
                            <div className="text-center">
                                <div className="font-serif text-emerald-900 mb-1">BIS</div>
                                <div className="text-xs text-gray-500">Hallmarked</div>
                            </div>
                            <div className="text-center">
                                <div className="font-serif text-emerald-900 mb-1">100%</div>
                                <div className="text-xs text-gray-500">Certified</div>
                            </div>
                            <div className="text-center">
                                <div className="font-serif text-emerald-900 mb-1">Free</div>
                                <div className="text-xs text-gray-500">Shipping</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20 pt-16 border-t border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="font-serif text-3xl text-white">You May Also Like</h2>
                            <Link href={`/shop?metal=${product.metal_type}`} className="text-sm font-medium text-accent hover:text-accent/80 hidden sm:block">
                                View Similar &rarr;
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && product.images && product.images.length > 0 && (
                <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <button 
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    
                    <div className="relative w-full max-w-5xl aspect-square md:aspect-video rounded-lg overflow-hidden shadow-2xl">
                        <Image
                            src={getOptimizedImageUrl(selectedImage || product.images[0], 1600)}
                            alt={product.name}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    
                    {/* Lightbox Thumbnails */}
                    {product.images.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-background/80 backdrop-blur-md rounded-lg border border-white/10">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(img)}
                                    className={cn(
                                        "relative h-16 w-16 rounded-sm overflow-hidden border-2 transition-all",
                                        (selectedImage === img || (!selectedImage && index === 0))
                                            ? "border-accent opacity-100"
                                            : "border-transparent opacity-50 hover:opacity-100"
                                    )}
                                >
                                    <Image src={getOptimizedImageUrl(img, 200)} alt={`Thumb ${index + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
