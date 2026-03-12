'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminAuthGuard } from '@/components/AdminAuthGuard'
import { Menu } from 'lucide-react'
import Image from 'next/image'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-gray-100">
                {/* Mobile Header */}
                <div className="md:hidden glass-dark text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-1.5 rounded-lg shadow-inner">
                            <Image
                                src="/mahilogo.png"
                                alt="Mahi Admin"
                                width={32}
                                height={32}
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-serif text-base tracking-[0.2em] uppercase text-accent leading-none">Mahi Admin</span>
                            <span className="text-[8px] text-emerald-400 tracking-[0.3em] uppercase mt-1">Management Studio</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-emerald-900/50 transition-all active:scale-95">
                        <Menu className="h-6 w-6 text-accent" />
                    </button>
                </div>

                <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="md:pl-72 flex flex-col flex-1">
                    {/* Desktop Header */}
                    <div className="hidden md:flex h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-10 items-center justify-between sticky top-0 z-20 shadow-sm">
                        <div>
                            <h1 className="text-2xl font-serif text-emerald-950 tracking-tight">Dashboard Overview</h1>
                            <p className="text-xs text-gray-500 tracking-wide uppercase mt-1">Mahi Fashion Management Studio</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Super Admin</span>
                                <span className="text-[10px] text-emerald-600 font-medium"> mahi@jewellery.com </span>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-950 shadow-lg flex items-center justify-center text-accent font-serif text-lg border border-accent/20">
                                M
                            </div>
                        </div>
                    </div>

                    <main className="flex-1 pb-8">
                        <div className="py-6 px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AdminAuthGuard>
    )
}
