import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client with service role key
 * Use this ONLY in API routes or server actions where you need admin privileges
 * DO NOT use this in client components
 */
export const createServerClient = async () => {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
        throw new Error('Missing Supabase server environment variables')
    }

    return createSSRClient(url, serviceRoleKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // This can be ignored if you have middleware refreshing user sessions.
                }
            },
        },
    })
}

/**
 * Server-side Supabase client with anon key (for server components/actions)
 * Use this in server components where you want RLS to apply
 */
export const createServerAnonClient = async () => {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createSSRClient(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // This can be ignored if you have middleware refreshing user sessions.
                }
            },
        },
    })
}

/**
 * Standardized Admin access check for API Routes.
 * Returns the Service Role Client if the user is an admin.
 */
export async function checkAdminAccess() {
    const supabase = await createServerAnonClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { error: 'Unauthorized', status: 401, supabaseAdmin: null, user: null }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Forbidden', status: 403, supabaseAdmin: null, user: null }
    }

    const supabaseAdmin = await createServerClient()
    return { supabaseAdmin, user, error: null, status: 200 }
}
