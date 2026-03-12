'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'

export default function DebugAdminPage() {
    const [status, setStatus] = useState('')

    const makeAdmin = async () => {
        setStatus('Promoting...')
        try {
            const res = await fetch('/api/debug/make-admin', { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setStatus('Success! You are now an Admin. Refresh the page or go to Admin Panel.')
            } else {
                setStatus('Error: ' + data.error)
            }
        } catch (err: any) {
            setStatus('Error: ' + err.message)
        }
    }

    return (
        <div className="p-20 text-center">
            <h1 className="text-2xl mb-4">Debug Admin Access</h1>
            <p className="mb-8">Use this tool to force promote your current user to Admin.</p>

            <Button onClick={makeAdmin}>Make Me Admin</Button>

            {status && <p className="mt-4 font-bold text-emerald-600">{status}</p>}
        </div>
    )
}
