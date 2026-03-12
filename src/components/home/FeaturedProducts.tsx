'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { ProductCard } from '@/components/ProductCard'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

import { useProductsStore } from '@/store/productsStore'

export function FeaturedProducts() {
    const { featuredProducts, loadingFeatured, fetchFeaturedProducts, subscribeToProducts } = useProductsStore()

    useEffect(() => {
        fetchFeaturedProducts()
        const unsubscribe = subscribeToProducts()
        return () => unsubscribe()
    }, [fetchFeaturedProducts, subscribeToProducts])

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    }

    if (loadingFeatured) {
        return (
            <section className="py-20 bg-emerald-50/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                    </div>
                </div>
            </section>
        )
    }

    if (featuredProducts.length === 0) {
        return null // Don't show section if no featured products
    }

    return (
        <section className="py-20 bg-emerald-50/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-serif text-4xl text-foreground mb-4">Featured Collection</h2>
                        <div className="h-1 w-24 bg-accent" />
                    </motion.div>
                    <Link href="/shop" className="hidden md:block">
                        <Button variant="outline" className="text-accent border-accent/30 hover:bg-accent/10 hover:border-accent font-medium tracking-wide">
                            View All Products &rarr;
                        </Button>
                    </Link>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {featuredProducts.map((product) => (
                        <motion.div key={product.id} variants={item}>
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </motion.div>

                <div className="mt-12 text-center md:hidden">
                    <Link href="/shop">
                        <Button variant="outline" className="w-full text-accent border-accent/30 hover:bg-accent/10 hover:border-accent font-medium tracking-wide">
                            View All Products &rarr;
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
