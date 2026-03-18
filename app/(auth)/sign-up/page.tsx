'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BrandPanel } from '@/components/features/auth/brand-panel'
import { OAuthButtons } from '@/components/features/auth/oauth-buttons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/onboarding`,
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email exists. Try signing in.')
        } else if (signUpError.message.includes('rate limit')) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else {
          setError(signUpError.message || 'Something went wrong. Please try again.')
        }
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Something went wrong. Check your connection and try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-6">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#818CF8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Check your inbox</h1>
          <p className="mb-7 text-[13px] leading-relaxed text-zinc-500">
            We sent a verification link to{' '}
            <span className="font-semibold text-zinc-300">{email}</span>. Click the link to complete
            your sign up.
          </p>
          <Button variant="secondary" onClick={() => router.push('/sign-in')}>
            Back to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-black">
      <BrandPanel />

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-10 lg:px-16 xl:px-20">
        {/* Mobile logo */}
        <div className="mb-6 flex items-center gap-2 lg:hidden">
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
          <div className="mb-6">
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">
              Create your account
            </h1>
            <p className="text-[13px] text-zinc-500">
              Join VibeCheck and get your AI projects evaluated
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3.5 py-2.5">
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
              <p className="text-[12px] text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* OAuth */}
            <OAuthButtons redirectTo="/dashboard/onboarding" />

            {/* Divider */}
            <div className="relative flex items-center gap-4 py-0.5">
              <div className="flex-1 border-t border-white/[0.07]" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                or
              </span>
              <div className="flex-1 border-t border-white/[0.07]" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              {/* Email */}
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
                  autoComplete="email"
                />
              </div>

              {/* Password */}
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
                    minLength={6}
                    autoComplete="new-password"
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
                <p className="text-[11px] text-zinc-600">Minimum 6 characters</p>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[11px] uppercase tracking-wider text-zinc-500"
                >
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    className={`pr-10 ${
                      confirmPassword && confirmPassword !== password
                        ? '!border-red-500/40'
                        : confirmPassword && confirmPassword === password
                          ? '!border-emerald-500/40'
                          : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-400"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-red-400">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[11px] text-emerald-400">Passwords match ✓</p>
                )}
              </div>

              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                disabled={loading}
                label={
                  <>
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      Privacy Policy
                    </Link>
                  </>
                }
              />

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
                    Creating account…
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <p className="pt-1 text-center text-[13px] text-zinc-500">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
