'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, ShoppingCart, TrendingUp, Settings, LogOut, Users, Image as ImageIcon, LayoutList, Share2, X, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Collections', href: '/admin/collections', icon: LayoutList },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Metal Rates', href: '/admin/metal-rates', icon: TrendingUp },
    { name: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Social Media', href: '/admin/social', icon: Share2 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-emerald-950 border-r border-emerald-900/50 shadow-2xl transform transition-transform duration-500 ease-[0.22, 1, 0.36, 1] md:translate-x-0 md:transform-none md:fixed md:inset-y-0 md:flex md:flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo & Close Button */}
                <div className="flex items-center justify-between h-20 px-6 bg-[#001a14] border-b border-emerald-900/30">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/mahilogo.png"
                            alt="Mahi Admin"
                            width={44}
                            height={44}
                            className="h-10 w-auto object-contain bg-white/10 rounded-lg p-1.5 shadow-inner"
                        />
                        <div className="flex flex-col">
                            <span className="font-serif text-lg text-accent tracking-[0.2em] uppercase leading-none">Mahi Fashion</span>
                            <span className="text-[10px] text-emerald-400 tracking-[0.3em] uppercase mt-1">Admin Studio</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden text-emerald-200 hover:text-white transition-colors p-2 hover:bg-emerald-900/50 rounded-full"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Nav */}
                <div className="flex-1 flex flex-col overflow-y-auto pt-8 pb-4">
                    <nav className="flex-1 px-4 space-y-1.5">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose} // Auto-close on mobile nav
                                    className={cn(
                                        isActive 
                                            ? 'bg-accent text-emerald-950 shadow-[0_4px_12px_rgba(212,175,55,0.25)]' 
                                            : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white',
                                        'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300'
                                    )}
                                >
                                    <item.icon className={cn(
                                        "mr-3.5 h-5 w-5 flex-shrink-0 transition-transform duration-300",
                                        isActive ? "scale-110" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                    )} aria-hidden="true" />
                                    <span className="tracking-wide">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex-shrink-0 flex border-t border-emerald-900/30 p-6 bg-[#001a14]/50">
                    <button className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all duration-300 group border border-transparent hover:border-red-400/20">
                        <LogOut className="h-5 w-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                        <span>Logout Account</span>
                    </button>
                </div>
            </div>
        </>
    )
}
