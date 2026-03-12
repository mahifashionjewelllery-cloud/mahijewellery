import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

interface WishlistState {
    items: Product[]
    isLoading: boolean
    hasHydrated: boolean
    setHydrated: (state: boolean) => void
    addItem: (product: Product) => Promise<void>
    removeItem: (productId: string) => Promise<void>
    isInWishlist: (productId: string) => boolean
    fetchWishlist: () => Promise<void>
    clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            isLoading: false,
            hasHydrated: false,
            setHydrated: (state) => {
                set({ hasHydrated: state })
            },
            fetchWishlist: async () => {
                set({ isLoading: true })
                try {
                    const response = await fetch('/api/user/wishlist')
                    if (response.ok) {
                        const data = await response.json()
                        set({ items: data })
                    } else if (response.status === 401) {
                         // User not logged in, rely on persisted local state temporarily
                    }
                } catch (error) {
                    console.error("Failed to fetch wishlist", error)
                } finally {
                    set({ isLoading: false })
                }
            },
            addItem: async (product) => {
                const currentItems = get().items
                if (!currentItems.find(item => item.id === product.id)) {
                    // Optimistic update
                    set({ items: [...currentItems, product] })

                    // Sync with server
                    try {
                        const res = await fetch('/api/user/wishlist', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ productId: product.id })
                        })
                        
                        if (res.status === 401) {
                            // Revert if unauthorized (optional: could prompt login)
                            console.log('User must login to save wishlist remotely.')
                        }
                    } catch (e) {
                         console.error("Failed to sync wishlist addition", e)
                    }
                }
            },
            removeItem: async (productId) => {
                // Optimistic update
                set({ items: get().items.filter(item => item.id !== productId) })
                
                // Sync with server
                try {
                    const res = await fetch(`/api/user/wishlist?productId=${productId}`, {
                        method: 'DELETE',
                    })
                    if (res.status === 401) {
                        console.log('User must login to save wishlist remotely.')
                    }
                } catch (e) {
                     console.error("Failed to sync wishlist removal", e)
                }
            },
            isInWishlist: (productId) => {
                return get().items.some(item => item.id === productId)
            },
            clearWishlist: () => {
                set({ items: [] })
            }
        }),
        {
            name: 'mahi-wishlist-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true)
            }
        }
    )
)
