'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BrandPanel } from '@/components/features/auth/brand-panel'
import { OAuthButtons } from '@/components/features/auth/oauth-buttons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Check your inbox and verify your email first.')
        } else {
          setError('Something went wrong. Check your connection and try again.')
        }
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Something went wrong. Check your connection and try again.')
      setLoading(false)
    }
  }

  const urlError = searchParams.get('error')
  const displayError =
    error || (urlError === 'auth_failed' ? 'Sign in was cancelled. Try again.' : null)

  return (
    <div className="flex min-h-dvh bg-black">
      <BrandPanel />

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-20">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.07] ring-1 ring-white/[0.1]">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#818CF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[14px] font-semibold text-white">VibeCheck</span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <div className="mb-7">
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-[13px] text-zinc-500">
              Sign in to continue to your VibeCheck account
            </p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3.5 py-2.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F87171"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-[12px] text-red-400">{displayError}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* OAuth */}
            <OAuthButtons redirectTo="/dashboard" />

            {/* Divider */}
            <div className="relative flex items-center gap-4 py-1">
              <div className="flex-1 border-t border-white/[0.07]" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                or
              </span>
              <div className="flex-1 border-t border-white/[0.07]" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-[11px] uppercase tracking-wider text-zinc-500"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[11px] uppercase tracking-wider text-zinc-500"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-400"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <p className="pt-1 text-center text-[13px] text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
