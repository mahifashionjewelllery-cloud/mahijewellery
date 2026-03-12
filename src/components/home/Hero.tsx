'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import Image from 'next/image'

export function Hero() {
    return (
        <section className="relative h-[80vh] sm:h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                >
                    <Image
                        src="/herojewell.png"
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority={true}
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#001a14] via-[#001a14]/60 to-[#001a14]/30 z-10" />
            </div>

            <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                >
                    <h1 className="font-serif text-4xl sm:text-7xl md:text-8xl text-white mb-6 tracking-tight leading-tight sm:leading-[1.1]">
                        Timeless <span className="text-accent italic font-light text-glow">Elegance</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="text-emerald-50/80 text-base sm:text-xl md:text-2xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light tracking-wide"
                >
                    Discover our exclusive collection of handcrafted gold and silver jewellery, designed to celebrate your most precious moments.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
                >
                    <Link href="/shop" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto min-w-[200px] md:min-w-[220px] h-14 md:h-16 text-base md:text-lg bg-accent text-emerald-950 hover:bg-white hover:scale-105 transition-all duration-300 shadow-accent">
                            Shop Collection
                        </Button>
                    </Link>
                    <Link href="/about" className="w-full sm:w-auto">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto min-w-[180px] md:min-w-[200px] h-14 md:h-16 text-base md:text-lg text-white border-white/20 hover:bg-white/10 hover:border-white glass backdrop-blur-md transition-all duration-300">
                            Our Story
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden md:block"
            >
                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="w-[1px] h-16 bg-gradient-to-b from-accent to-transparent" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent/70 mt-4 font-medium">Scroll</span>
                </motion.div>
            </motion.div>
        </section>
    )
}
