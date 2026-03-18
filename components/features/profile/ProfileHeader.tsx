'use client'

import { Github, Linkedin, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const LEVEL_CONFIG = {
  architect: {
    label: 'Architect',
    className: 'border-violet-500/25 bg-violet-500/10 text-violet-400',
  },
  builder: { label: 'Builder', className: 'border-sky-500/25 bg-sky-500/10 text-sky-400' },
  maker: { label: 'Maker', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' },
  foundational: {
    label: 'Foundational',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  },
  provisional: {
    label: 'Provisional',
    className: 'border-white/[0.1] bg-white/[0.04] text-zinc-500',
  },
}

interface ProfileHeaderProps {
  profile: {
    username: string
    display_name: string
    avatar_url?: string | null
    bio?: string | null
    github_username?: string | null
    linkedin_url?: string | null
    profile_rating?: number | null
    certificate_level?: string | null
  }
  evaluatedProjectCount: number
}

export function ProfileHeader({ profile, evaluatedProjectCount }: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false)
  const hasCertificate = profile.profile_rating !== null && evaluatedProjectCount >= 3
  const level = profile.certificate_level as keyof typeof LEVEL_CONFIG | null

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${profile.username}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          {/* Left: Identity */}
          <div className="flex items-start gap-5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-18 w-18 shrink-0 rounded-full border-2 border-white/[0.08]"
              />
            ) : (
              <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full border-2 border-white/[0.08] bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {profile.display_name}
              </h1>
              <p className="mb-2 text-[13px] text-zinc-500">@{profile.username}</p>
              {profile.bio && (
                <p className="mb-3 max-w-md text-[13px] leading-relaxed text-zinc-400">
                  {profile.bio}
                </p>
              )}
              <div className="flex gap-4">
                {profile.github_username && (
                  <a
                    href={`https://github.com/${profile.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    <Github size={13} /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Rating + Share */}
          <div className="flex flex-col items-end gap-3">
            {hasCertificate && level && LEVEL_CONFIG[level] && (
              <div className="text-right">
                <div className="text-4xl font-bold tabular-nums text-white">
                  {profile.profile_rating?.toFixed(1)}
                </div>
                <div className="mb-2 text-[11px] text-zinc-600">/ 100 Profile Rating</div>
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${LEVEL_CONFIG[level].className}`}
                >
                  ✦ {LEVEL_CONFIG[level].label}
                </span>
                <p className="mt-2 text-[11px] text-zinc-600">
                  {evaluatedProjectCount} {evaluatedProjectCount === 1 ? 'project' : 'projects'}{' '}
                  evaluated
                </p>
              </div>
            )}
            <Button onClick={handleShare} variant="secondary" size="sm">
              <Share2 size={12} className="mr-1.5" />
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
