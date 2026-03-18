import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/auth-helpers'
import { SettingsProfile } from '@/components/features/dashboard/settings/settings-profile'
import { SettingsAccount } from '@/components/features/dashboard/settings/settings-account'
import { SettingsDangerZone } from '@/components/features/dashboard/settings/settings-danger-zone'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/sign-in')
  }

  if (!profile.onboarding_done) {
    redirect('/dashboard/onboarding')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Manage your account, profile, and preferences
        </p>
      </div>

      <SettingsProfile profile={profile} />
      <SettingsAccount profile={profile} userEmail={user.email || null} />
      <SettingsDangerZone profile={profile} />
    </div>
  )
}
