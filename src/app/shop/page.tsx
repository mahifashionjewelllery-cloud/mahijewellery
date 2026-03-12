'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Product } from '@/types'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import { Filter, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function ProductSkeleton() {
    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-emerald-950/5 flex flex-col h-full animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-5" />
                <div className="mt-auto pt-4 border-t border-emerald-900/5 flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 rounded-full" />
                </div>
            </div>
        </div>
    )
}

import { useProductsStore } from '@/store/productsStore'

function ShopContent() {
    const searchParams = useSearchParams()
    const initialMetal = searchParams.get('metal') || 'all'
    const searchQueryInput = searchParams.get('search') || ''

    const [filter, setFilter] = useState(initialMetal)
    const [purityFilter, setPurityFilter] = useState<string[]>([])
    
    const { products, loadingProducts, fetchProducts, subscribeToProducts } = useProductsStore()
    const [loadingMore, setLoadingMore] = useState(false)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    
    const ITEMS_PER_PAGE = 8

    useEffect(() => {
        const unsubscribe = subscribeToProducts()
        return () => unsubscribe()
    }, [subscribeToProducts])

    useEffect(() => {
        // Reset and fetch when filters change
        setPage(0)
        const loadInitial = async () => {
            const more = await fetchProducts({
                filter,
                searchQuery: searchQueryInput,
                purityFilter,
                pageIndex: 0,
                itemsPerPage: ITEMS_PER_PAGE,
                isInitial: true
            })
            setHasMore(more)
        }
        loadInitial()
    }, [filter, searchQueryInput, purityFilter, fetchProducts])

    const handleLoadMore = async () => {
        setLoadingMore(true)
        const nextPage = page + 1
        setPage(nextPage)
        const more = await fetchProducts({
            filter,
            searchQuery: searchQueryInput,
            purityFilter,
            pageIndex: nextPage,
            itemsPerPage: ITEMS_PER_PAGE,
            isInitial: false
        })
        setHasMore(more)
        setLoadingMore(false)
    }

    const availablePurities = filter === 'gold' ? ['18K', '22K', '24K'] : filter === 'silver' ? ['92.5', 'pure'] : ['18K', '22K', '24K', '92.5', 'pure']

    const togglePurity = (purity: string) => {
        setPurityFilter(prev => 
            prev.includes(purity) ? prev.filter(p => p !== purity) : [...prev, purity]
        )
    }

    return (
        <div className="bg-background min-h-screen py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header & Mobile Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 border-b border-emerald-900/10 pb-10">
                    <div className="text-center md:text-left">
                        <h1 className="font-serif text-5xl lg:text-6xl text-emerald-50 tracking-tight">Our Curated Collection</h1>
                        {searchQueryInput ? (
                            <p className="text-emerald-100/80 font-light italic mt-3">Refining elegance for "{searchQueryInput}"</p>
                        ) : (
                            <p className="text-accent/80 font-medium uppercase tracking-[0.2em] text-xs mt-3">Timeless craftsmanship, delivered to you</p>
                        )}
                    </div>
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden w-full md:w-auto h-14 rounded-2xl border-emerald-900/10 bg-white/50 backdrop-blur-md shadow-sm"
                    >
                        <Filter className="mr-2 h-5 w-5" /> Filter Selection
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Sidebar Filters */}
                    <div className={cn(
                        "lg:w-1/4 flex-shrink-0 space-y-8 lg:block relative transition-all duration-300",
                        isSidebarOpen ? "block mb-6 lg:mb-0" : "hidden"
                    )}>
                        <div className="bg-white/5 p-6 rounded-lg border border-white/10 lg:sticky lg:top-28">
                            <div className="flex justify-between items-center mb-6 lg:hidden">
                                <h3 className="font-serif text-xl text-emerald-50">Filters</h3>
                                <button onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5 text-emerald-100/70" /></button>
                            </div>

                            {/* Metal Type Filter */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-4">Metal Type</h3>
                                <div className="space-y-2">
                                    {['all', 'gold', 'silver', 'diamond'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => { setFilter(type); setPurityFilter([]); }}
                                            className={cn(
                                                "block w-full text-left px-3 py-2 rounded-md text-sm transition-colors capitalize",
                                                filter === type ? "bg-accent text-emerald-950 font-medium shadow-md shadow-accent/20" : "text-emerald-100/80 hover:bg-white/10 hover:text-emerald-50"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Purity Filter */}
                            {filter !== 'diamond' && filter !== 'all' && (
                                <div>
                                    <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-4">Purity</h3>
                                    <div className="space-y-3">
                                        {availablePurities.map((purity) => (
                                            <label key={purity} className="flex items-center group cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={purityFilter.includes(purity)}
                                                    onChange={() => togglePurity(purity)}
                                                    className="rounded border-white/20 bg-white/5 text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                                                />
                                                <span className="ml-3 text-sm text-emerald-100/80 group-hover:text-emerald-50 transition-colors">{purity}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="lg:w-3/4 flex-grow">
                        {loadingProducts && products.length === 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => <ProductSkeleton key={i} />)}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                    
                                    {loadingMore && [1, 2].map(i => <ProductSkeleton key={`more-${i}`} />)}
                                </div>

                                {hasMore && !loadingMore && (
                                    <div className="mt-12 text-center">
                                        <Button 
                                            variant="outline" 
                                            size="lg" 
                                            onClick={handleLoadMore}
                                            className="min-w-[200px]"
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center bg-white/5 rounded-lg border border-dashed border-white/20 py-20 backdrop-blur-sm">
                                <h3 className="font-serif text-2xl text-emerald-50 mb-2">No products found</h3>
                                <p className="text-emerald-100/70 mb-6">Try adjusting your filters or search query.</p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => { setFilter('all'); setPurityFilter([]); }}
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default function ShopPage() {
    return (
        <Suspense fallback={
            <div className="bg-background min-h-screen py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="font-serif text-4xl text-accent border-b border-white/5 pb-6 mb-8">Our Collection</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => <ProductSkeleton key={`suspense-${i}`} />)}
                    </div>
                </div>
            </div>
        }>
            <ShopContent />
        </Suspense>
    )
}
