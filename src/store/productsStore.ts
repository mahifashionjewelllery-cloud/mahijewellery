import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { Product } from '@/types'

interface ProductsState {
    featuredProducts: Product[]
    products: Product[]
    loadingFeatured: boolean
    loadingProducts: boolean
    error: string | null
    fetchFeaturedProducts: () => Promise<void>
    fetchProducts: (options: { 
        filter: string, 
        searchQuery: string, 
        purityFilter: string[], 
        pageIndex: number, 
        itemsPerPage: number,
        isInitial?: boolean 
    }) => Promise<boolean> // returns hasMore
    subscribeToProducts: () => () => void
}

export const useProductsStore = create<ProductsState>((set, get) => ({
    featuredProducts: [],
    products: [],
    loadingFeatured: false,
    loadingProducts: false,
    error: null,

    fetchFeaturedProducts: async () => {
        set({ loadingFeatured: true })
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_images(image_url)
                `)
                .eq('is_featured', true)
                .limit(4)

            if (error) throw error

            const productsWithImages = data?.map(product => ({
                ...product,
                images: product.product_images?.map((img: any) => img.image_url) || []
            })) || []

            set({ featuredProducts: productsWithImages, error: null })
        } catch (err: any) {
            console.error('Error fetching featured products:', err)
            set({ error: err.message })
        } finally {
            set({ loadingFeatured: false })
        }
    },

    fetchProducts: async ({ filter, searchQuery, purityFilter, pageIndex, itemsPerPage, isInitial = false }) => {
        try {
            set({ loadingProducts: true })
            const supabase = createClient()
            let query = supabase
                .from('products')
                .select(`*, product_images(image_url)`)

            if (filter !== 'all') {
                query = query.eq('metal_type', filter)
            }

            if (purityFilter.length > 0) {
                query = query.in('purity', purityFilter)
            }

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`)
            }

            const from = pageIndex * itemsPerPage
            const to = from + itemsPerPage - 1

            const { data, error } = await query.range(from, to)

            if (error) throw error

            const productsWithImages = data?.map(product => ({
                ...product,
                images: product.product_images?.map((img: any) => img.image_url) || []
            })) || []

            if (isInitial) {
                set({ products: productsWithImages })
            } else {
                set(state => ({ products: [...state.products, ...productsWithImages] }))
            }

            return productsWithImages.length === itemsPerPage
        } catch (error: any) {
            console.error('Error fetching products:', error)
            set({ error: error.message })
            return false
        } finally {
            set({ loadingProducts: false })
        }
    },

    subscribeToProducts: () => {
        const supabase = createClient()
        const channel = supabase
            .channel('public:products_multi')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products'
                },
                () => {
                    get().fetchFeaturedProducts()
                    // We don't necessarily want to refresh all products in the shop automatically 
                    // as it might disrupt pagination/filtering state, but for "sometimes not showing"
                    // it might be necessary. Let's at least keep featured in sync.
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_images'
                },
                () => {
                    get().fetchFeaturedProducts()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }
}))
