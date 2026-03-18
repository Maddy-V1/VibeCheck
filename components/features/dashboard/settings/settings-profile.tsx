'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Check, X } from 'lucide-react'

interface SettingsProfileProps {
  profile: Profile
}

export function SettingsProfile({ profile }: SettingsProfileProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    github_username: profile.github_username || '',
    linkedin_url: profile.linkedin_url || '',
  })

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          bio: formData.bio || null,
          github_username: formData.github_username || null,
          linkedin_url: formData.linkedin_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setSuccess('Profile updated')
      setIsEditing(false)
      router.refresh()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.025]">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Profile</h2>
          <p className="mt-0.5 text-[12px] text-zinc-600">Update your public profile information</p>
        </div>
        {!isEditing ? (
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil size={12} className="mr-1.5" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Check size={12} className="mr-1.5" />
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false)
                setFormData({
                  display_name: profile.display_name || '',
                  bio: profile.bio || '',
                  github_username: profile.github_username || '',
                  linkedin_url: profile.linkedin_url || '',
                })
              }}
              disabled={isSaving}
            >
              <X size={13} />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-[12px] text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-[12px] text-emerald-400">
            <Check size={13} /> {success}
          </div>
        )}

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
            {formData.display_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-[13px] font-medium text-white">
              {formData.display_name || 'Your Name'}
            </p>
            <p className="text-[11px] text-zinc-600">@{profile.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">
              Display Name
            </Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              disabled={!isEditing}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">Username</Label>
            <Input value={profile.username || ''} disabled className="opacity-50" />
            <p className="text-[10px] text-zinc-700">Username cannot be changed</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-zinc-500">Bio</Label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            disabled={!isEditing}
            rows={3}
            maxLength={300}
            placeholder="Tell us about yourself..."
          />
          {isEditing && (
            <p className="text-right text-[10px] text-zinc-700">{formData.bio.length}/300</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">
              GitHub Username
            </Label>
            <Input
              value={formData.github_username}
              onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
              disabled={!isEditing}
              placeholder="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-zinc-500">
              LinkedIn URL
            </Label>
            <Input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              disabled={!isEditing}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
