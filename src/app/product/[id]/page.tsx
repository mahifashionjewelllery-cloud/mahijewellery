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
import { ShoppingBag, Star, HelpCircle, ArrowLeft, Heart, Maximize2, X, Plus, Minus, ChevronDown, ChevronRight, ShieldCheck, Truck } from 'lucide-react'
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
        <div className="bg-background min-h-screen">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
                {/* Breadcrumb / Back button */}
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <Link href="/shop" className="inline-flex items-center text-sm text-emerald-100 hover:text-emerald-50 mb-6 lg:mb-8 transition-colors group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-serif tracking-widest uppercase text-xs">Back to Collection</span>
                    </Link>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                    {/* Left Column: Image Gallery (Sticky on desktop) */}
                    <div className="w-full lg:w-[60%] lg:sticky lg:top-24 self-start">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ duration: 0.7 }}
                            className="relative"
                        >
                            <div 
                                className="aspect-square sm:aspect-video lg:aspect-square relative rounded-3xl overflow-hidden bg-emerald-950/20 group cursor-zoom-in border border-white/5 shadow-2xl" 
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                {product.images && product.images.length > 0 ? (
                                    <>
                                        <Image
                                            src={getOptimizedImageUrl(selectedImage || product.images[0], 1200)}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 60vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            priority
                                        />
                                        <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl border border-white/10 scale-90 group-hover:scale-100">
                                            <Maximize2 className="h-5 w-5 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-emerald-800/20 bg-emerald-950/10">
                                        <ShoppingBag className="h-24 w-24" />
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {product.images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(img)}
                                            className={cn(
                                                "relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                                                (selectedImage === img || (!selectedImage && index === 0))
                                                    ? 'border-accent shadow-lg shadow-accent/20 scale-105'
                                                    : 'border-white/5 opacity-60 hover:opacity-100 hover:border-white/20'
                                            )}
                                        >
                                            <Image
                                                src={getOptimizedImageUrl(img, 300)}
                                                alt={`${product.name} ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Column: Details Section (Scrollable) */}
                    <div className="w-full lg:w-[40%] flex flex-col pt-2 lg:pt-0">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-[10px] font-bold text-accent px-3 py-1 bg-accent/10 rounded-full uppercase tracking-[0.3em] border border-accent/20">{product.metal_type}</span>
                                <span className="h-4 w-px bg-white/10" />
                                <span className="text-[10px] text-emerald-100/60 font-bold uppercase tracking-[0.2em]">{product.purity} Purity</span>
                                <span className="h-4 w-px bg-white/10" />
                                <span className="text-[10px] text-emerald-100/60 font-bold uppercase tracking-[0.2em]">{product.weight}G Net Weight</span>
                            </div>

                            <h1 className="font-serif text-4xl sm:text-5xl lg:text-5xl xl:text-6xl text-white mb-6 tracking-tight leading-[1.1]">
                                {product.name}
                            </h1>

                            <p className="text-emerald-100/70 text-base lg:text-lg leading-relaxed mb-8 font-light italic border-l-2 border-accent/30 pl-6">
                                {product.description}
                            </p>

                            {/* Pricing Card - Custom Premium Design */}
                            <div className="bg-[#001a14]/60 backdrop-blur-xl p-6 lg:p-8 rounded-[2rem] mb-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 border-b border-white/5 pb-8 relative z-10">
                                    <div>
                                        <span className="block text-[10px] text-accent font-bold uppercase tracking-[0.4em] mb-3">Estimated Investment</span>
                                        <span className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">{formatCurrency(priceDetails.total)}</span>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0 gap-2">
                                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                            Inclusive of 3% GST
                                        </span>
                                        <span className="text-[9px] text-accent/60 italic font-medium">Live market price applied</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 relative z-10">
                                    <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] mb-6">Transparent Valuation</h4>
                                    
                                    <div className="flex justify-between items-center group">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/80 font-medium tracking-wide">Main Metal Value</span>
                                            <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase mt-0.5">
                                                {product.weight}g × {formatCurrency(metalRate)} / g
                                            </span>
                                        </div>
                                        <span className="font-serif font-bold text-xl text-white">{formatCurrency(priceDetails.breakdown.metalPrice)}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 group">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/80 font-medium tracking-wide">Artisanal Making Fees</span>
                                            <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase mt-0.5">
                                                {product.making_charge_type === 'percentage' 
                                                    ? `${product.making_charge_value}% Craftsmanship Charge` 
                                                    : `Boutique Signature Charge`
                                                }
                                            </span>
                                        </div>
                                        <span className="font-serif font-bold text-xl text-white">{formatCurrency(priceDetails.breakdown.makingCharges)}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                                        <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-accent">Government GST (3%)</span>
                                        <span className="font-serif font-bold text-xl text-white">{formatCurrency(priceDetails.breakdown.gst)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-4 mb-10">
                                <div className="flex gap-4">
                                    <div className="flex items-center border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-inner h-16 flex-1 lg:flex-none justify-between px-3 min-w-[140px]">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 text-accent hover:bg-accent/10 transition-all rounded-xl flex items-center justify-center active:scale-90 border border-transparent hover:border-accent/20">
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="font-serif text-2xl font-bold text-white w-8 text-center">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 text-accent hover:bg-accent/10 transition-all rounded-xl flex items-center justify-center active:scale-90 border border-transparent hover:border-accent/20">
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    <Button 
                                        variant="outline" 
                                        size="lg" 
                                        className="h-16 w-16 px-0 rounded-2xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center border-white/10 shrink-0 shadow-lg active:scale-95"
                                        onClick={toggleWishlist}
                                    >
                                        <Heart className={cn("h-6 w-6 transition-all duration-300", inWishlist ? "fill-red-500 text-red-500 scale-110" : "text-emerald-100/40")} />
                                    </Button>
                                </div>
                                
                                <Button
                                    size="lg"
                                    className="w-full text-lg h-16 rounded-2xl transition-all font-bold tracking-widest bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-[#001a14] shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:brightness-105 active:scale-[0.98] border-none uppercase text-sm sm:text-lg"
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingBag className="mr-3 h-6 w-6 shrink-0" />
                                    <span className="truncate">
                                        {isAdding ? 'Securing for Cart...' : `Reserve Selection • ${formatCurrency(priceDetails.total * quantity)}`}
                                    </span>
                                </Button>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <Truck className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white tracking-wide uppercase mb-1">Insured Shipping</p>
                                        <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-tighter">Secure national delivery</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <ShieldCheck className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white tracking-wide uppercase mb-1">Certified Quality</p>
                                        <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-tighter">BIS Hallmarked Gold</p>
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Info Accordions (Premium Style) */}
                            <div className="space-y-4 border-t border-white/5 pt-10 mb-10">
                                {[
                                    { 
                                        id: 'details', 
                                        name: 'Product Master Data', 
                                        icon: HelpCircle,
                                        content: (
                                            <div className="space-y-4 py-4 px-6 bg-white/5 rounded-2xl mb-4 border border-white/5">
                                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Material Base</span>
                                                    <span className="text-xs font-serif font-bold text-white tracking-wider">{product.metal_type}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Purity Standard</span>
                                                    <span className="text-xs font-serif font-bold text-white tracking-wider">{product.purity}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Net Gram Weight</span>
                                                    <span className="text-xs font-serif font-bold text-white tracking-wider">{product.weight}G</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Signature Collection</span>
                                                    <span className="text-xs font-serif font-bold text-white tracking-wider uppercase">{product.collection_id || 'Signature'}</span>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'shipping', 
                                        name: 'Delivery Logistics', 
                                        icon: Truck,
                                        content: (
                                            <div className="py-4 px-6 bg-white/5 rounded-2xl mb-4 border border-white/5 space-y-3">
                                                <p className="text-[11px] text-white/60 leading-relaxed group flex items-start gap-2">
                                                    <span className="text-accent mt-0.5">•</span>
                                                    Fully insured white-glove shipping across the nation.
                                                </p>
                                                <p className="text-[11px] text-white/60 leading-relaxed group flex items-start gap-2">
                                                    <span className="text-accent mt-0.5">•</span>
                                                    Expedited delivery within 3-7 business days of authentication.
                                                </p>
                                                <p className="text-[11px] text-white/60 leading-relaxed group flex items-start gap-2">
                                                    <span className="text-accent mt-0.5">•</span>
                                                    15-day artisanal return window for unworn items.
                                                </p>
                                            </div>
                                        )
                                    }
                                ].map((item) => (
                                    <div key={item.id} className="group">
                                        <button 
                                            className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 transition-all rounded-2xl border border-white/5 group-hover:border-accent/20"
                                            onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                                        >
                                            <div className="flex items-center gap-4 text-white font-serif tracking-[0.1em] text-sm uppercase">
                                                <item.icon className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
                                                <span>{item.name}</span>
                                            </div>
                                            <ChevronDown className={cn("h-4 w-4 text-accent transition-transform duration-500", activeAccordion === item.id && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {activeAccordion === item.id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} 
                                                    animate={{ height: 'auto', opacity: 1 }} 
                                                    exit={{ height: 0, opacity: 0 }} 
                                                    className="overflow-hidden mt-3"
                                                >
                                                    {item.content}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom Identity/Trust */}
                            <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 flex justify-between items-center text-center">
                                <div className="space-y-1">
                                    <div className="font-serif text-accent text-lg font-bold tracking-widest">BIS</div>
                                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Hallmarked</div>
                                </div>
                                <div className="h-10 w-px bg-white/10" />
                                <div className="space-y-1">
                                    <div className="font-serif text-accent text-lg font-bold tracking-widest">100%</div>
                                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Certified</div>
                                </div>
                                <div className="h-10 w-px bg-white/10" />
                                <div className="space-y-1">
                                    <div className="font-serif text-accent text-lg font-bold tracking-widest">PURE</div>
                                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Authenticity</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Related Products Section (Expanded) */}
                {relatedProducts.length > 0 && (
                    <div className="mt-24 lg:mt-32 pt-20 lg:pt-24 border-t border-white/5">
                        <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-12 lg:mb-16 gap-4">
                            <div className="text-center sm:text-left">
                                <h2 className="font-serif text-4xl lg:text-5xl text-white tracking-tight mb-4 lowercase italic">You May Also Like<span className="text-accent not-italic">.</span></h2>
                                <p className="text-emerald-100/40 text-xs tracking-[0.3em] uppercase">Curated selections from the {product.metal_type} collection</p>
                            </div>
                            <Link href={`/shop?metal=${product.metal_type}`} className="group flex items-center gap-3 text-sm font-bold text-accent hover:text-white transition-all uppercase tracking-[0.2em] bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:border-accent/40">
                                <span>View Similar</span>
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-10">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox Modal (Ultra Premium) */}
            <AnimatePresence>
                {isLightboxOpen && product.images && product.images.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-12"
                    >
                        <button 
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[110] border border-white/10 hover:border-white/20 group backdrop-blur-xl"
                        >
                            <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                        
                        <div className="relative w-full h-[70vh] md:h-[80vh] rounded-3xl overflow-hidden">
                            <motion.div 
                                key={selectedImage || product.images[0]}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full relative"
                            >
                                <Image
                                    src={getOptimizedImageUrl(selectedImage || product.images[0], 1600)}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </div>
                        
                        {/* Lightbox Thumbnails */}
                        {product.images.length > 1 && (
                            <div className="mt-12 flex gap-4 p-4 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 max-w-full overflow-x-auto scrollbar-hide">
                                {product.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(img)}
                                        className={cn(
                                            "relative h-20 w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                                            (selectedImage === img || (!selectedImage && index === 0))
                                                ? "border-accent scale-110 shadow-lg shadow-accent/20"
                                                : "border-transparent opacity-40 hover:opacity-100"
                                        )}
                                    >
                                        <Image src={getOptimizedImageUrl(img, 300)} alt={`Thumb ${index + 1}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-8 text-center hidden md:block">
                            <h3 className="text-white font-serif text-2xl tracking-widest uppercase mb-1">{product.name}</h3>
                            <p className="text-accent text-[10px] tracking-[0.5em] font-bold uppercase">{product.metal_type} Edition</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
