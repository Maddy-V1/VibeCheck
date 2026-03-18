'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem('welcome-banner-dismissed')

    // Check if user just completed onboarding (within last 5 seconds)
    const onboardingCompleted = sessionStorage.getItem('onboarding-completed')

    if (!dismissed && onboardingCompleted) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('welcome-banner-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="animate-in fade-in slide-in-from-top-2 mb-6 duration-500">
      <div className="relative overflow-hidden rounded-lg border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[14px] font-medium text-white">
              You're set up. Your dashboard is empty. That's temporary. Probably.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
