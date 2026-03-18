'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Check, Mail, Key, Eye, EyeOff, Globe, Info } from 'lucide-react'

interface SettingsAccountProps {
  profile: Profile
  userEmail: string | null
}

export function SettingsAccount({ profile, userEmail }: SettingsAccountProps) {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(profile.is_profile_public || false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleTogglePublic = async () => {
    const newValue = !isPublic
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_profile_public: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setIsPublic(newValue)
      setSuccess(`Profile is now ${newValue ? 'public' : 'private'}`)
      router.refresh()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visibility')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!userEmail) {
      setError('No email address found')
      return
    }

    setIsResettingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      })

      if (resetError) throw resetError

      setSuccess(`Password reset link sent to ${userEmail}`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] p-5">
        <h2 className="text-[15px] font-semibold text-white">Account</h2>
        <p className="mt-0.5 text-[12px] text-zinc-600">Manage your account security and privacy</p>
      </div>

      <div className="space-y-4 p-5">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-[12px] text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-[12px] text-emerald-400">
            <Check size={13} /> {success}
          </div>
        )}

        {/* Email */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
              <Mail size={14} className="text-zinc-500" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-zinc-400">Email Address</p>
              <p className="text-[13px] text-white">{userEmail || 'No email'}</p>
            </div>
          </div>
        </div>

        {/* Password reset */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
              <Key size={14} className="text-zinc-500" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-zinc-400">Password</p>
              <p className="text-[11px] text-zinc-600">Reset via email link</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetPassword}
            disabled={isResettingPassword || !userEmail}
          >
            {isResettingPassword ? 'Sending…' : 'Reset Password'}
          </Button>
        </div>

        {/* Profile visibility */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
              {isPublic ? (
                <Eye size={14} className="text-emerald-400" />
              ) : (
                <EyeOff size={14} className="text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-[12px] font-medium text-zinc-400">Profile Visibility</p>
              <p className="text-[11px] text-zinc-600">
                {isPublic ? `Public at vibecheck.com/u/${profile.username}` : 'Only visible to you'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              isPublic ? 'bg-indigo-500' : 'bg-zinc-700'
            } disabled:opacity-50`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Profile rating info */}
        <div className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <Info size={14} className="mt-0.5 shrink-0 text-zinc-600" />
          <div>
            <p className="text-[12px] font-medium text-zinc-400">Profile Rating</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">
              Your profile rating is calculated after you have 3+ evaluated projects. Current:{' '}
              {profile.profile_rating
                ? `${Number(profile.profile_rating).toFixed(0)}/100`
                : 'Not yet rated'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
