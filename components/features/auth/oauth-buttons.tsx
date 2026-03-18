'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Github, Linkedin } from 'lucide-react'

interface OAuthButtonsProps {
  redirectTo?: string
}

export function OAuthButtons({ redirectTo = '/dashboard' }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handleOAuthSignIn = async (provider: 'github' | 'google' | 'linkedin_oidc') => {
    try {
      setLoading(provider)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('OAuth error:', error)
      setLoading(null)
    }
  }

  const btnClass =
    'group flex w-full items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:border-white/[0.14] hover:text-zinc-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'

  const spinnerEl = (
    <svg className="ml-auto h-3.5 w-3.5 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleOAuthSignIn('github')}
        disabled={loading !== null}
        className={btnClass}
      >
        <Github className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
        {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
        {loading === 'github' && spinnerEl}
      </button>

      <button
        type="button"
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading !== null}
        className={btnClass}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09A6.97 6.97 0 015.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
        {loading === 'google' && spinnerEl}
      </button>

      <button
        type="button"
        onClick={() => handleOAuthSignIn('linkedin_oidc')}
        disabled={loading !== null}
        className={btnClass}
      >
        <Linkedin className="h-4 w-4 shrink-0 text-[#0A66C2]" />
        {loading === 'linkedin_oidc' ? 'Connecting...' : 'Continue with LinkedIn'}
        {loading === 'linkedin_oidc' && spinnerEl}
      </button>
    </div>
  )
}
