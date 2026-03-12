'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const checkAuth = async () => {
            try {
                const supabase = createClient()

                // 1. Check if user is logged in
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    console.log('Redirecting to /login - No session', { authError })
                    if (mounted) {
                        setIsLoading(false)
                        router.push('/login')
                    }
                    return
                }

                // 2. Safety Fallback: If it's the specific admin email, grant access even if profile fails
                const adminEmail = 'mahifashionjewelllery@gmail.com'
                if (user.email === adminEmail) {
                    console.log('Admin Access granted via email fallback')
                    if (mounted) {
                        setIsAuthorized(true)
                        setIsLoading(false)
                    }
                    return
                }

                // 3. Check if user has admin role in profiles table
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                console.log('Admin Profile Check:', { userId: user.id, profile, profileError })

                if (profile?.role === 'admin') {
                    if (mounted) {
                        setIsAuthorized(true)
                        setIsLoading(false)
                    }
                    return
                }

                // If we reach here, user is NOT an admin
                console.log('Redirecting to / - Not admin', { role: profile?.role })
                if (mounted) {
                    setIsLoading(false)
                    router.push('/')
                }
            } catch (err) {
                console.error('Final Auth Guard Exception:', err)
                if (mounted) {
                    setIsLoading(false)
                    router.push('/')
                }
            }
        }

        checkAuth()

        return () => {
            mounted = false
        }
    }, [router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying access...</p>
                </div>
            </div>
        )
    }

    if (!isAuthorized) {
        return null
    }

    return <>{children}</>
}
