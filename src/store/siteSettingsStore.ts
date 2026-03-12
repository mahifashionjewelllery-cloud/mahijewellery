import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { SiteSettings, RawSiteSetting } from '@/types'

interface SiteSettingsState {
    settings: SiteSettings & { gallery_images?: string[] }
    loading: boolean
    error: string | null
    fetchSettings: () => Promise<void>
    updateSetting: (key: string, value: any) => void
    subscribeToSettings: () => () => void
}

const DEFAULT_SETTINGS: SiteSettings = {
    site_name: 'Mahi Fashion Jewellery',
    contact_email: 'mahifashionjewelllery@gmail.com',
    contact_phone: '+91 1234567890',
    address: 'City, State, India',
    about_text: 'Crafting timeless elegance in gold and silver.',
    logo_url: '/mahilogo.png',
}

export const useSiteSettingsStore = create<SiteSettingsState>((set, get) => ({
    settings: DEFAULT_SETTINGS,
    loading: false,
    error: null,

    fetchSettings: async () => {
        set({ loading: true })
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')

            if (error) throw error

            if (data && data.length > 0) {
                const newSettings = { ...DEFAULT_SETTINGS } as any
                data.forEach((item: RawSiteSetting) => {
                    newSettings[item.key] = item.value
                })
                set({ settings: newSettings, error: null })
            }
        } catch (err: any) {
            console.error('Error fetching site settings:', err)
            set({ error: err.message })
        } finally {
            set({ loading: false })
        }
    },

    updateSetting: (key: string, value: any) => {
        set((state) => ({
            settings: {
                ...state.settings,
                [key]: value
            }
        }))
    },

    subscribeToSettings: () => {
        const supabase = createClient()
        const channel = supabase
            .channel('site_settings_all')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_settings'
                },
                (payload) => {
                    const { key, value } = payload.new as RawSiteSetting
                    if (key) {
                        get().updateSetting(key, value)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }
}))
