'use client'

import { Hero } from '@/components/home/Hero'
import { Categories } from '@/components/home/Categories'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Lightbox } from '@/components/ui/Lightbox'
import { Instagram, ArrowRight } from 'lucide-react'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'

export default function Home() {
  // Fetch gallery images from database (with fallback if Supabase not configured)
  const { settings, fetchSettings, subscribeToSettings } = useSiteSettingsStore()
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  useEffect(() => {
    fetchSettings()
    const unsubscribe = subscribeToSettings()
    return () => unsubscribe()
  }, [fetchSettings, subscribeToSettings])

  const galleryImages = settings.gallery_images || [
    'https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515562141207-7a88fb0537bf?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=1935&auto=format&fit=crop'
  ]


  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />

      {/* Short About/Trust Section */}
      <section className="py-24 bg-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-serif text-3xl md:text-5xl mb-6">Purity. Trust. Tradition.</h2>
          <p className="text-emerald-100/80 text-lg leading-relaxed mb-10">
            At Mahi Fashion Jewellery, we believe that jewellery is more than just an accessory. It is an investment, a heritage, and a statement of who you are.
            All our gold is Hallmark certified and our diamonds are ethically sourced.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 border border-emerald-800 rounded-sm">
              <h3 className="font-serif text-xl text-accent mb-2">BIS Hallmarked</h3>
              <p className="text-sm text-emerald-200/60">Guaranteed purity in every piece.</p>
            </div>
            <div className="p-6 border border-emerald-800 rounded-sm">
              <h3 className="font-serif text-xl text-accent mb-2">Lifetime Exchange</h3>
              <p className="text-sm text-emerald-200/60">Easy exchange and buyback policies.</p>
            </div>
            <div className="p-6 border border-emerald-800 rounded-sm">
              <h3 className="font-serif text-xl text-accent mb-2">Free Insurance</h3>
              <p className="text-sm text-emerald-200/60">One year complimentary insurance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram/Gallery Section */}
      <section className="py-24 bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6 text-center md:text-left">
            <div className="max-w-xl flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 text-accent mb-4">
                <Instagram className="h-6 w-6" />
                <span className="text-sm font-semibold tracking-widest uppercase">Social Gallery</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-white">Captured Elegance</h2>
            </div>
            <Link href="/gallery" className="w-full md:w-auto">
              <Button variant="outline" className="w-full md:w-auto group border-accent/30 text-accent hover:bg-accent hover:text-emerald-950">
                View Full Gallery
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {galleryImages.slice(0, 4).map((imageUrl, index) => (
              <div 
                key={index} 
                className="relative aspect-[4/5] bg-emerald-900/50 border border-white/5 rounded-lg overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-500"
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={imageUrl}
                  alt={`Gallery piece ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox for Home Gallery */}
      <Lightbox
        images={galleryImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        onNavigate={(index) => setLightboxIndex(index)}
      />
    </>
  )
}
