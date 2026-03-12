'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Globe } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
)

const AVAILABLE_ICONS: any = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    mail: Mail,
    whatsapp: WhatsappIcon,
    globe: Globe
}

export function Footer() {
    const [socialLinks, setSocialLinks] = useState<any[]>([])
    const { settings, fetchSettings, subscribeToSettings } = useSiteSettingsStore()

    useEffect(() => {
        fetchSettings()
        const unsubscribe = subscribeToSettings()
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        const fetchLinks = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('social_links')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true })

            if (data) setSocialLinks(data)
        }

        fetchLinks()

        // Real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('social_links_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'social_links'
                },
                () => {
                    fetchLinks()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const renderIcon = (iconName: string) => {
        const Icon = AVAILABLE_ICONS[iconName] || Globe
        return <Icon className="h-5 w-5" />
    }

    return (
        <footer className="bg-emerald-950 border-t border-white/10 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1 text-center md:text-left flex flex-col items-center md:items-start">
                        <Link href="/" className="flex items-center gap-3 mb-6 group">
                            <Image
                                src={settings.logo_url || "/mahilogo.png"}
                                alt={settings.site_name}
                                width={50}
                                height={50}
                                className="h-12 w-auto object-contain"
                            />
                            <span className="font-serif text-2xl text-accent tracking-widest uppercase group-hover:text-white transition-colors">
                                {settings.site_name}
                            </span>
                        </Link>
                        <p className="text-emerald-100/70 text-sm leading-relaxed mb-8 max-w-sm mx-auto md:mx-0">
                            {settings.about_text}
                        </p>
                        <div className="flex space-x-5 justify-center md:justify-start">
                            {socialLinks.map((link) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-300 hover:text-accent transition-all hover:-translate-y-1 duration-300"
                                    title={link.platform}
                                >
                                    {renderIcon(link.icon)}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div className="text-center md:text-left">
                        <h3 className="text-accent font-serif tracking-widest uppercase text-sm mb-6 pb-2 border-b border-white/5 inline-block">Shop</h3>
                        <ul className="space-y-4 text-sm text-emerald-100/70">
                            <li><Link href="/shop?category=rings" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Rings</Link></li>
                            <li><Link href="/shop?category=necklaces" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Necklaces</Link></li>
                            <li><Link href="/shop?category=earrings" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Earrings</Link></li>
                            <li><Link href="/shop?category=bracelets" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Bracelets</Link></li>
                            <li><Link href="/shop?metal=gold" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Gold Jewellery</Link></li>
                            <li><Link href="/shop?metal=silver" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Silver Jewellery</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="text-center md:text-left">
                        <h3 className="text-accent font-serif tracking-widest uppercase text-sm mb-6 pb-2 border-b border-white/5 inline-block">Support</h3>
                        <ul className="space-y-4 text-sm text-emerald-100/70">
                            <li><Link href="/about" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Contact Us</Link></li>
                            <li><Link href="/faqs" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">FAQs</Link></li>
                            <li><Link href="/shipping-returns" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Shipping & Returns</Link></li>
                            <li><Link href="/jewellery-care" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Jewellery Care</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-accent hover:-translate-y-0.5 md:hover:translate-x-1 inline-block transition-all duration-300">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 mt-16 pt-8 pb-4 text-center text-xs text-emerald-100/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} Mahi Fashion Jewellery. All rights reserved.</p>
                    <p>Designed with elegance in mind.</p>
                </div>
            </div>
        </footer>
    )
}
