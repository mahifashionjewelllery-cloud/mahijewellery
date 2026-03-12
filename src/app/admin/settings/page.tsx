'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, Settings, Save, RefreshCw, Mail, Phone, MapPin, Info, Globe } from 'lucide-react'
import { RawSiteSetting, SiteSettings } from '@/types'
import { useToast } from '@/context/ToastContext'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'

const DEFAULT_SETTINGS: SiteSettings = {
    site_name: 'Mahi Fashion Jewellery',
    contact_email: 'mahifashionjewelllery@gmail.com',
    contact_phone: '+91 1234567890',
    address: 'City, State, India',
    about_text: 'Crafting timeless elegance in gold and silver.',
    logo_url: '/mahilogo.png',
}

export default function AdminSettingsPage() {
    const { settings: globalSettings, fetchSettings: syncStore } = useSiteSettingsStore()
    const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const { showToast } = useToast()

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/site-settings')
            const data = await response.json()
            
            if (data.settings) {
                const newSettings = { ...DEFAULT_SETTINGS }
                data.settings.forEach((item: RawSiteSetting) => {
                    if (item.key in newSettings) {
                        (newSettings as any)[item.key] = item.value
                    }
                })
                setSettings(newSettings)
                syncStore()
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            showToast('Failed to fetch settings', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (key: keyof SiteSettings, value: any) => {
        setSaving(key)
        try {
            const response = await fetch('/api/site-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update setting')
            }

            setSettings(prev => ({ ...prev, [key]: value }))
            showToast(`${key.replace('_', ' ')} updated!`, 'success')
            syncStore()
        } catch (error: any) {
            console.error('Error updating setting:', error)
            showToast(error.message, 'error')
        } finally {
            setSaving(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-900" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
                <Button variant="outline" size="sm" onClick={fetchSettings}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Sync
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Identity Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="h-5 w-5 text-emerald-900" />
                        <h2 className="text-lg font-semibold text-gray-900">Visual Identity</h2>
                    </div>

                    <div className="space-y-4">
                        <section>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.site_name} 
                                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                />
                                <Button size="sm" onClick={() => handleUpdate('site_name', settings.site_name)} disabled={saving === 'site_name'}>
                                    {saving === 'site_name' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                        </section>

                        <section>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.logo_url} 
                                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                                />
                                <Button size="sm" onClick={() => handleUpdate('logo_url', settings.logo_url)} disabled={saving === 'logo_url'}>
                                    {saving === 'logo_url' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                        </section>

                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Phone className="h-5 w-5 text-emerald-900" />
                        <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
                    </div>

                    <div className="space-y-4">
                        <section>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.contact_email} 
                                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                                />
                                <Button size="sm" onClick={() => handleUpdate('contact_email', settings.contact_email)} disabled={saving === 'contact_email'}>
                                    {saving === 'contact_email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                        </section>

                        <section>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.contact_phone} 
                                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                                />
                                <Button size="sm" onClick={() => handleUpdate('contact_phone', settings.contact_phone)} disabled={saving === 'contact_phone'}>
                                    {saving === 'contact_phone' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                        </section>

                        <section>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.address} 
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                />
                                <Button size="sm" onClick={() => handleUpdate('address', settings.address)} disabled={saving === 'address'}>
                                    {saving === 'address' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <Info className="h-5 w-5 text-emerald-900" />
                    <h2 className="text-lg font-semibold text-gray-900">About Content</h2>
                </div>
                <div className="space-y-2">
                    <textarea 
                        className="w-full h-32 rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                        value={settings.about_text}
                        onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                    />
                    <div className="flex justify-end">
                        <Button onClick={() => handleUpdate('about_text', settings.about_text)} disabled={saving === 'about_text'}>
                            {saving === 'about_text' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save About Text
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
