'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle size={22} className="text-red-400" />
      </div>
      <h2 className="mb-1 text-lg font-bold text-white">Something went wrong</h2>
      <p className="mb-6 max-w-sm text-center text-[13px] text-zinc-500">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button variant="secondary" onClick={reset}>
        <RefreshCw size={13} className="mr-1.5" />
        Try Again
      </Button>
    </div>
  )
}
