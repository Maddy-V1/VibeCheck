'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Github, Linkedin } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [bio, setBio] = useState('')
  const [githubUsername, setGithubUsername] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      setUserEmail(user.email || '')

      const { data: profile } = (await supabase
        .from('profiles')
        .select('display_name, username, onboarding_done')
        .eq('id', user.id)
        .single()) as {
        data: { display_name: string | null; username: string; onboarding_done: boolean } | null
      }

      if (profile?.onboarding_done) {
        router.push('/dashboard')
        return
      }
      if (profile) {
        setDisplayName(profile.display_name || '')
        setUsername(profile.username || '')
      }
    }
    loadProfile()
  }, [router, supabase])

  useEffect(() => {
    if (currentStep !== 1 || !username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }
    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true)

      try {
        // Get current user to exclude their own username
        const {
          data: { user },
        } = await supabase.auth.getUser()

        // Use the database function to check username availability
        // This bypasses RLS policies to check all usernames
        const { data, error } = await (supabase as any).rpc('check_username_available', {
          p_username: username.toLowerCase().trim(),
          p_user_id: user?.id || null,
        })

        if (error) {
          console.error('Username check error:', error)
          setUsernameAvailable(null)
        } else {
          setUsernameAvailable(data === true)
        }
      } catch (err) {
        console.error('Username check exception:', err)
        setUsernameAvailable(null)
      }

      setCheckingUsername(false)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [username, currentStep, supabase])

  const handleNext = async () => {
    setError(null)
    if (currentStep === 1) {
      if (!displayName.trim()) {
        setError('Please enter your display name.')
        return
      }
      if (!username.trim() || username.length < 3) {
        setError('Username must be at least 3 characters.')
        return
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError('Username can only contain letters, numbers, hyphens, and underscores.')
        return
      }
      if (usernameAvailable === false) {
        setError('That username is taken. Try another.')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (bio.length > 300) {
        setError('Bio must be 300 characters or less.')
        return
      }
      if (linkedinUrl && !linkedinUrl.includes('linkedin.com/')) {
        setError('Please enter a valid LinkedIn URL.')
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!agreedToGuidelines) {
        setError('Please read and agree to the guidelines.')
        return
      }
      if (!hasScrolled) {
        setError('Please scroll through the guidelines.')
        return
      }
      await completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: username.toLowerCase().trim(),
          bio: bio.trim() || null,
          github_username: githubUsername.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          onboarding_done: true,
        })
        .eq('id', user.id)
      if (updateError) throw updateError

      // Set flag for welcome banner
      sessionStorage.setItem('onboarding-completed', 'true')

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGuidelinesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) setHasScrolled(true)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-black">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 55%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 border-b border-white/[0.06] px-6 py-7">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/[0.1]">
              <svg
                width="18"
                height="18"
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
            <span className="text-[18px] font-semibold text-white">VibeCheck</span>
          </div>
          <h1 className="mb-3 text-[17px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Onboarding
          </h1>
          <p className="mb-2 text-[15px] leading-relaxed text-zinc-400">
            Your future employer is going to Google you anyway. Let's give them something worth
            finding.
          </p>
          {userEmail && <p className="text-[13px] text-zinc-600">Email : {userEmail}</p>}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 1 — Your Identity */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    Step 1 of 3
                  </p>
                  <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
                    Your identity.
                  </h1>
                  <p className="text-[14px] leading-relaxed text-zinc-400">
                    Pick a name. Pick a handle. This shows up when someone Googles you after
                    clicking your VibeCheck link. No pressure. Actually, medium pressure.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
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
                    <p className="text-[13px] text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="displayName"
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
                    >
                      Display name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                      autoFocus
                      className="h-11"
                    />
                    <p className="text-[12px] text-zinc-600">What humans call you.</p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
                    >
                      Username
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                        disabled={loading}
                        className={`h-11 ${
                          usernameAvailable === false
                            ? '!border-red-500/40 !ring-red-500/15'
                            : usernameAvailable === true
                              ? '!border-emerald-500/40 !ring-emerald-500/15'
                              : ''
                        }`}
                      />
                      {checkingUsername && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg
                            className="h-4 w-4 animate-spin text-zinc-600"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
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
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[12px] text-zinc-600">
                        vibecheck.com/u/{username || 'you'} — choose something you can say out loud
                        in a job interview.
                      </p>
                      {usernameAvailable === true && (
                        <p className="shrink-0 text-[12px] font-medium text-emerald-400">
                          ✓ Available
                        </p>
                      )}
                      {usernameAvailable === false && (
                        <p className="shrink-0 text-[12px] font-medium text-red-400">✗ Taken</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={
                      loading ||
                      !displayName.trim() ||
                      !username.trim() ||
                      usernameAvailable === false
                    }
                    className="group"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Connect & Share */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    Step 2 of 3
                  </p>
                  <h1 className="mb-1 text-3xl font-bold tracking-tight text-white">
                    The optional stuff.
                  </h1>
                  <p className="mb-2 text-[14px] text-zinc-500">(That actually matters.)</p>
                  <p className="text-[14px] leading-relaxed text-zinc-400">
                    You don't have to fill this in. But your evaluator will Google you anyway. Might
                    as well control the narrative.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
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
                    <p className="text-[13px] text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="bio"
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
                    >
                      Bio
                    </Label>
                    <textarea
                      id="bio"
                      placeholder="What do you build? Why should anyone care?"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={loading}
                      maxLength={300}
                      rows={3}
                      autoFocus
                      className="flex w-full resize-none rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-[14px] text-white transition-colors placeholder:text-zinc-600 focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-zinc-600">
                        What do you build? Why should anyone care? Make every character count.
                      </p>
                      <p className="text-[12px] text-zinc-600">{bio.length}/300</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="github"
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
                    >
                      <Github className="mr-1.5 inline h-3.5 w-3.5" />
                      GitHub
                    </Label>
                    <Input
                      id="github"
                      type="text"
                      placeholder="johndoe"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value.replace('@', ''))}
                      disabled={loading}
                      className="h-11"
                    />
                    <p className="text-[12px] text-zinc-600">
                      Show the receipts. Or don't. (We'll judge either way.)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="linkedin"
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500"
                    >
                      <Linkedin className="mr-1.5 inline h-3.5 w-3.5" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/johndoe"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      disabled={loading}
                      className="h-11"
                    />
                    <p className="text-[12px] text-zinc-600">
                      For when you need to look employable, not just employable-adjacent.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)} disabled={loading}>
                    Back
                  </Button>
                  <Button size="lg" onClick={handleNext} disabled={loading} className="group">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Community Pledge */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    Step 3 of 3
                  </p>
                  <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
                    One page. Then you're in.
                  </h1>
                  <p className="text-[14px] leading-relaxed text-zinc-400">
                    We built something worth protecting. Skim at your own risk. There's a checkbox
                    at the bottom. It won't feel right to click it without reading this.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
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
                    <p className="text-[13px] text-red-400">{error}</p>
                  </div>
                )}

                <div
                  className="mb-4 h-64 overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 text-[13px] leading-relaxed"
                  onScroll={handleGuidelinesScroll}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-1 text-[14px] font-semibold text-zinc-200">
                        1. Be a person, not a reply guy.
                      </h3>
                      <p className="text-zinc-400">
                        Disagreement is fine. Contempt is not. Most people know the line when they
                        cross it.
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-1 text-[14px] font-semibold text-zinc-200">
                        2. Feedback that helps &gt; feedback that stings.
                      </h3>
                      <p className="text-zinc-400">
                        If your comment wouldn't survive being read aloud in a code review, don't
                        post it.
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-1 text-[14px] font-semibold text-zinc-200">
                        3. This isn't your marketing channel.
                      </h3>
                      <p className="text-zinc-400">
                        You get a profile. You get a portfolio. Self-promotion lives there. Not in
                        the feed.
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-1 text-[14px] font-semibold text-zinc-200">
                        4. You built it. You submit it.
                      </h3>
                      <p className="text-zinc-400">
                        Your project. Your code. Your mess. Not someone else's. Credit belongs to
                        the people who earned it.
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-1 text-[14px] font-semibold text-zinc-200">
                        5. See something, say something.
                      </h3>
                      <p className="text-zinc-400">
                        The report button exists for a reason. Use it. We read every single one.
                      </p>
                    </div>

                    <div className="border-t border-white/[0.07] pt-4">
                      <p className="text-[12px] text-zinc-600">
                        Violations result in warnings, suspensions, or bans. Severity matters.
                      </p>
                    </div>
                  </div>
                </div>

                {!hasScrolled && (
                  <p className="mb-4 flex items-center gap-2 text-[12px] text-zinc-600">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                    Yes, you have to scroll. No, we're not sorry.
                  </p>
                )}

                <div className="mb-5">
                  <Checkbox
                    id="guidelines"
                    checked={agreedToGuidelines}
                    onCheckedChange={(checked) => setAgreedToGuidelines(checked === true)}
                    disabled={loading}
                    label="I read this. I get it. I'm in."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setCurrentStep(2)} disabled={loading}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={loading || !agreedToGuidelines || !hasScrolled}
                    className="group"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
                        Setting up...
                      </span>
                    ) : (
                      <>
                        Take me to my dashboard
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
