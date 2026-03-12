'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingBag, User, Menu, X, Search, LogOut, Heart, Home, Store, LayoutGrid, ImageIcon, Info, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar() {
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [userName, setUserName] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const cartItems = useCartStore((state) => state.items)
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)
    
    const wishlistItems = useWishlistStore((state) => state.items)
    const fetchWishlist = useWishlistStore((state) => state.fetchWishlist)
    const clearWishlist = useWishlistStore((state) => state.clearWishlist)
    const hasHydrated = useWishlistStore((state) => state.hasHydrated)
    const totalWishlistItems = wishlistItems.length
    
    const { settings, fetchSettings, subscribeToSettings } = useSiteSettingsStore()

    useEffect(() => {
        fetchSettings()
        const unsubscribe = subscribeToSettings()
        return () => unsubscribe()
    }, [])

    // Handle scroll for sticky behavior
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Check for user session
    useEffect(() => {
        const supabase = createClient()

        const fetchProfile = async (userId: string) => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', userId)
                .single()

            if (data?.full_name) {
                setUserName(data.full_name)
            }
        }

        // Get initial user securely
        supabase.auth.getUser().then(({ data: { user } }) => {
            const currentUser = user ?? null
            setUser(currentUser)
            if (currentUser) {
                // Check metadata first for immediate display
                if (currentUser.user_metadata?.full_name) {
                    setUserName(currentUser.user_metadata.full_name)
                }
                // Then fetch from profile to be sure
                fetchProfile(currentUser.id)
                if (hasHydrated) fetchWishlist()
            } else {
                setUserName(null)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                if (currentUser.user_metadata?.full_name) {
                    setUserName(currentUser.user_metadata.full_name)
                }
                fetchProfile(currentUser.id)
                if (hasHydrated) fetchWishlist()
            } else {
                setUserName(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [hasHydrated])

    // Handle body scroll locking when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMenuOpen])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        clearWishlist()
        router.push('/')
        router.refresh()
    }

    return (
        <nav className={cn(
            "sticky top-0 z-50 transition-all duration-300",
            scrolled ? "bg-background border-b border-white/10 shadow-lg shadow-black/20 py-0" : "bg-background border-b border-transparent py-2 pt-0 md:pt-2"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 transition-all duration-300">

                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-3 group">
                            <Image
                                src={settings.logo_url || "/mahilogo.png"}
                                alt={settings.site_name}
                                width={50}
                                height={50}
                                className="h-12 w-auto object-contain"
                                priority
                            />
                            <div className="flex flex-col items-start leading-none">
                                <span className="font-serif text-2xl sm:text-3xl text-accent tracking-widest uppercase font-bold">
                                    {settings.site_name.split(' ')[0]}
                                </span>
                                <span className="font-sans text-[0.6rem] sm:text-xs text-emerald-100 tracking-[0.2em] sm:tracking-[0.3em] uppercase group-hover:text-white transition-colors">
                                    {settings.site_name.split(' ').slice(1).join(' ')}
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden lg:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link href="/" className="relative text-foreground/80 hover:text-accent transition-colors px-1 py-2 text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
                                Home
                            </Link>
                            <Link href="/shop" className="relative text-foreground/80 hover:text-accent transition-colors px-1 py-2 text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
                                Shop
                            </Link>
                            <Link href="/collections" className="relative text-foreground/80 hover:text-accent transition-colors px-1 py-2 text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
                                Collections
                            </Link>
                            <Link href="/gallery" className="relative text-foreground/80 hover:text-accent transition-colors px-1 py-2 text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
                                Gallery
                            </Link>
                            <Link href="/about" className="relative text-foreground/80 hover:text-accent transition-colors px-1 py-2 text-sm font-medium after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
                                About
                            </Link>
                        </div>
                    </div>

                    {/* Icons */}
                    <div className="hidden lg:flex items-center gap-2 lg:gap-4">
                        <div className="relative group flex items-center justify-end h-10 w-48 lg:w-64">
                            <div className={cn(
                                "flex items-center bg-white/5 rounded-full px-3 py-2 transition-all duration-500 ease-out origin-right absolute right-0",
                                isSearchOpen ? "w-48 lg:w-64 opacity-100 scale-x-100" : "w-10 opacity-0 scale-x-0 pointer-events-none"
                            )}>
                                <Search className="h-4 w-4 text-accent/70 mr-2 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent border-none focus:outline-none text-sm text-foreground w-full placeholder:text-gray-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            window.location.href = `/shop?search=${e.currentTarget.value}`
                                        }
                                    }}
                                    autoFocus={isSearchOpen}
                                    onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                                />
                            </div>
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={cn("text-foreground/80 hover:text-accent transition-all duration-300 p-2 absolute right-0", isSearchOpen ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100")}
                            >
                                <Search className="h-5 w-5" />
                            </button>
                        </div>
                        {user ? (
                            <div className="relative group">
                                <button className="text-foreground/80 hover:text-accent transition-colors p-2 flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    <span className="text-sm hidden xl:inline capitalize text-emerald-100/90 group-hover:text-accent">{userName || user.email?.split('@')[0]}</span>
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-background border border-white/10 rounded-md shadow-xl opacity-0 translate-y-2 invisible group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible transition-all duration-300">
                                    <Link href="/orders" className="block px-4 py-3 text-sm text-foreground/80 hover:bg-white/5 hover:text-accent transition-colors">
                                        Profile
                                    </Link>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-foreground/80 hover:bg-white/5 hover:text-accent transition-colors flex items-center gap-2 border-t border-white/5">
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link href="/login" className="text-foreground/80 hover:text-accent transition-colors p-2">
                                <User className="h-5 w-5" />
                            </Link>
                        )}
                        <Link href="/wishlist" className="text-foreground/80 hover:text-accent transition-colors p-2 relative">
                            <Heart className="h-5 w-5" />
                            {totalWishlistItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-background bg-accent rounded-full">
                                    {totalWishlistItems}
                                </span>
                            )}
                        </Link>
                        <Link href="/cart" className="text-foreground/80 hover:text-accent transition-colors p-2 relative">
                            <ShoppingBag className="h-5 w-5" />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-background bg-accent rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="lg:hidden flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                            className="text-foreground/80 hover:text-accent transition-colors p-1.5"
                            aria-label="Search"
                        >
                            {isMobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                        </button>
                        <Link href="/wishlist" className="text-foreground/80 hover:text-accent transition-colors p-1.5 relative">
                            <Heart className="h-4 w-4" />
                            {totalWishlistItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-bold leading-none text-background bg-accent rounded-full">
                                    {totalWishlistItems}
                                </span>
                            )}
                        </Link>
                        <Link href="/cart" className="text-foreground/80 hover:text-accent transition-colors p-1.5 relative">
                            <ShoppingBag className="h-4 w-4" />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-bold leading-none text-background bg-accent rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-foreground hover:text-accent focus:outline-none"
                            aria-label="Toggle mobile menu"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-[55] lg:hidden will-change-opacity"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            key="mobile-menu"
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{ originX: 1, originY: 0 }}
                            className="fixed top-20 right-4 w-60 bg-[#001a14]/98 backdrop-blur-md border border-accent/20 shadow-2xl z-[60] lg:hidden flex flex-col rounded-xl overflow-hidden will-change-[transform,opacity]"
                        >
                            {/* Menu Items */}
                            <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
                                {[
                                    { name: 'Home', href: '/', icon: Home },
                                    { name: 'Shop', href: '/shop', icon: Store },
                                    { name: 'Collections', href: '/collections', icon: LayoutGrid },
                                    { name: 'Gallery', href: '/gallery', icon: ImageIcon },
                                    { name: 'About', href: '/about', icon: Info }
                                ].map((link, idx) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                    >
                                        <Link
                                            href={link.href}
                                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all duration-300 group"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent/20 transition-all duration-300">
                                                    <link.icon className="h-4 w-4 text-accent/80 group-hover:text-accent" />
                                                </div>
                                                <span className="font-serif text-sm font-light text-emerald-100 group-hover:text-white tracking-wide">
                                                    {link.name}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-3.5 w-3.5 text-accent/40 group-hover:text-accent/80 transition-all duration-300" />
                                        </Link>
                                    </motion.div>
                                ))}

                                <div className="mt-1 pt-1 border-t border-white/10">
                                    {user ? (
                                        <div className="space-y-1">
                                            <Link
                                                href="/orders"
                                                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all duration-300 group"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent/20 transition-all duration-300">
                                                        <User className="h-4 w-4 text-accent/80 group-hover:text-accent" />
                                                    </div>
                                                    <span className="font-serif text-sm font-light text-emerald-100 group-hover:text-white tracking-wide">Profile</span>
                                                </div>
                                                <ChevronRight className="h-3.5 w-3.5 text-accent/40 group-hover:text-accent/80 transition-all duration-300" />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    handleLogout()
                                                    setIsMenuOpen(false)
                                                }}
                                                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-red-500/10 transition-all duration-300 group"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-all duration-300">
                                                    <LogOut className="h-4 w-4 text-emerald-50/50 group-hover:text-red-400" />
                                                </div>
                                                <span className="font-serif text-sm font-light text-emerald-100 group-hover:text-red-400 tracking-wide">Logout</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="flex items-center justify-center gap-3 p-3 rounded-full bg-transparent hover:bg-accent/5 border border-accent/40 text-accent hover:border-accent transition-all duration-300 group w-full my-2"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                            <span className="font-serif font-bold tracking-[0.1em] text-[11px] uppercase">Sign In</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            
            {/* Mobile Search Bar Overlay */}
            <AnimatePresence>
                {isMobileSearchOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="lg:hidden border-t border-white/5 bg-background shadow-xl overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="relative flex items-center bg-white/5 rounded-xl px-4 py-3 ring-1 ring-white/10 focus-within:ring-accent/50 transition-all">
                                <Search className="h-5 w-5 text-accent/70 mr-3 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search jewellery..."
                                    className="bg-transparent border-none focus:outline-none text-base text-foreground w-full placeholder:text-gray-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            window.location.href = `/shop?search=${e.currentTarget.value}`
                                            setIsMobileSearchOpen(false)
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
