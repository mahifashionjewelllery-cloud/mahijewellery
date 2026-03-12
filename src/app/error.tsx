'use client'
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Home } from 'lucide-react'
import Link from 'next/link'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-emerald-950/10">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-serif text-emerald-950 mb-3">Something went wrong!</h2>
        <p className="text-gray-500 mb-8 text-sm">
          We apologize, but there was an unexpected error. Our team has been notified.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
            onClick={() => reset()}
            className="w-full sm:w-auto"
            >
            Try again
            </Button>
            <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                    <Home className="mr-2 h-4 w-4" /> Go Home
                </Button>
            </Link>
        </div>
      </div>
    </div>
  )
}
