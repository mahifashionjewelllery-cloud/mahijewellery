import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { MetalRate } from '@/types'

interface MetalRatesState {
    rates: MetalRate[]
    isLoading: boolean
    error: string | null
    fetchRates: () => Promise<void>
    subscribeToRates: () => (() => void)
    getRate: (metalType: string, purity: string) => number
}

// Global fallback rates if DB fetch fails or is empty initially
const FALLBACK_RATES: { [key: string]: number } = {
    'gold-24K': 7250,
    'gold-22K': 6850,
    'gold-18K': 5600,
    'silver-92.5': 88,
    'silver-PURE': 90,
}

export const useMetalRatesStore = create<MetalRatesState>((set, get) => ({
    rates: [],
    isLoading: false,
    error: null,

    fetchRates: async () => {
        set({ isLoading: true, error: null })
        try {
            const supabase = createClient()
            const { data, error } = await supabase.from('metal_rates').select('*')

            if (error) throw error

            if (data) {
                set({ rates: data, isLoading: false })
            }
        } catch (err: any) {
            console.error('Failed to fetch metal rates:', err)
            set({ error: err.message, isLoading: false })
        }
    },

    subscribeToRates: () => {
        const supabase = createClient()
        
        const channel = supabase
            .channel('metal_rates_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'metal_rates'
                },
                (payload) => {
                    console.log('Metal rates change received:', payload)
                    // Refresh all rates to ensure consistency
                    const { fetchRates } = get()
                    fetchRates()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    },

    getRate: (metalType: string, purity: string) => {
        const { rates } = get()
        const targetMetal = metalType.toLowerCase()
        const targetPurity = purity.toLowerCase()

        // Find the specific rate for the metal type and purity
        const exactRate = rates.find(
            r => r.metal_type.toLowerCase() === targetMetal &&
                r.purity.toLowerCase() === targetPurity
        )

        if (exactRate) {
            return exactRate.rate_per_gram
        }

        // Fallback or calculation if exact match not found
        // Standardize keys for FALLBACK_RATES lookup
        const fallbackKey = `${targetMetal}-${purity.toUpperCase()}`
        return FALLBACK_RATES[fallbackKey] || 0
    }
}))
