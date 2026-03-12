'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Lightbox } from '@/components/ui/Lightbox'
import { Loader2, Camera, Instagram, Sparkles } from 'lucide-react'
import { getOptimizedImageUrl } from '@/lib/cloudinary-client'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'

export default function GalleryPage() {
    const { settings, loading, fetchSettings, subscribeToSettings } = useSiteSettingsStore()
    const [lightboxIndex, setLightboxIndex] = useState(-1)

    useEffect(() => {
        fetchSettings()
        const unsubscribe = subscribeToSettings()
        return () => unsubscribe()
    }, [fetchSettings, subscribeToSettings])

    const images = settings.gallery_images || []

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-900" />
            </div>
        )
    }

    return (
        <div className="bg-emerald-950 min-h-screen pb-20 overflow-hidden">
            {/* Header Section */}
            <section className="relative bg-black/20 border-b border-white/5 py-16 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <div className="bg-accent/20 p-3 rounded-full mb-6 border border-accent/20">
                            <Camera className="h-8 w-8 text-accent" />
                        </div>
                        <h1 className="font-serif text-4xl md:text-6xl mb-4 text-white">Our Gallery</h1>
                        <p className="text-emerald-100/70 text-lg max-w-2xl mx-auto leading-relaxed">
                            A curated showcase of our finest handcrafted pieces and the timeless traditions 
                            of Mahi Fashion Jewellery.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Gallery Grid */}
            <div className="max-w-7xl mx-auto px-4 mt-16">
                {images.length === 0 ? (
                    <div className="text-center py-20 bg-emerald-900/20 rounded-lg border-2 border-dashed border-white/5">
                        <Sparkles className="h-12 w-12 text-emerald-800 mx-auto mb-4" />
                        <p className="text-emerald-100/40 font-medium">No masterpieces to show yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {images.map((imageUrl, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="relative break-inside-avoid group cursor-pointer overflow-hidden rounded-lg shadow-xl border border-white/5 hover:border-accent/30 transition-all duration-500"
                                onClick={() => setLightboxIndex(index)}
                            >
                                <Image
                                    src={getOptimizedImageUrl(imageUrl, 800)}
                                    alt={`Gallery collection ${index + 1}`}
                                    width={800}
                                    height={1000}
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <Instagram className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Social CTA */}
            <section className="mt-24 max-w-5xl mx-auto px-4">
                <div className="bg-emerald-50 rounded-2xl p-8 md:p-12 text-center border border-emerald-100">
                    <h2 className="font-serif text-2xl md:text-3xl text-emerald-950 mb-4">Follow Our Journey</h2>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                        Get behind-the-scenes access and be the first to see our newest arrivals by following us on social media.
                    </p>
                    <div className="flex justify-center gap-4">
                        <a 
                            href="https://instagram.com/mahifashionjewellery" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-accent hover:bg-emerald-900 text-emerald-950 hover:text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
                        >
                            <Instagram className="h-5 w-5" />
                            Follow on Instagram
                        </a>
                    </div>
                </div>
            </section>

            {/* Lightbox Integration */}
            <Lightbox
                images={images}
                currentIndex={lightboxIndex}
                isOpen={lightboxIndex >= 0}
                onClose={() => setLightboxIndex(-1)}
                onNavigate={(index) => setLightboxIndex(index)}
            />
        </div>
    )
}
