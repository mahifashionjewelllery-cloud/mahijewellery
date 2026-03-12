import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { Collection } from '@/types'

interface CollectionsState {
    collections: Collection[]
    loading: boolean
    error: string | null
    fetchCollections: () => Promise<void>
    subscribeToCollections: () => () => void
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
    collections: [],
    loading: false,
    error: null,

    fetchCollections: async () => {
        set({ loading: true })
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('collections')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })

            if (error) throw error

            set({ collections: data || [], error: null })
        } catch (err: any) {
            console.error('Error fetching collections:', err)
            set({ error: err.message })
        } finally {
            set({ loading: false })
        }
    },

    subscribeToCollections: () => {
        const supabase = createClient()
        const channel = supabase
            .channel('public:collections')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'collections'
                },
                () => {
                    // Refresh data on any change
                    get().fetchCollections()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }
}))
