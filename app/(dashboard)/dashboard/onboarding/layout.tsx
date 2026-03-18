import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/auth-helpers'
import type { Profile } from '@/lib/types'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const profile = (await getCurrentProfile()) as Profile | null

  // If onboarding is already done, redirect to dashboard
  if (profile?.onboarding_done) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
