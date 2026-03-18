'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface BadgeShareSectionProps {
  projectId: string
  projectTitle: string
  badge: {
    certificate_url?: string | null
    verification_id?: string | null
  } | null
  evaluation: {
    score_total: number
    tier_confirmed: string
  }
}

export function BadgeShareSection({
  projectId,
  projectTitle,
  badge,
  evaluation,
}: BadgeShareSectionProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}/badge/${projectId}`
    navigator.clipboard.writeText(url)
    alert('Badge link copied! Share it on social media.')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!badge) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-zinc-500">Your badge is being generated...</p>
        <Button size="sm" variant="outline" onClick={handleRefresh}>
          Refresh Page
        </Button>
      </div>
    )
  }

  return (
    <>
      {badge.certificate_url ? (
        <div className="relative mb-4 aspect-[2/1] w-full overflow-hidden rounded-lg bg-white/[0.06]">
          <img
            src={badge.certificate_url}
            alt={`${projectTitle} badge`}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="mb-4 rounded-lg border-2 border-brand/30 bg-gradient-to-br from-brand/5 to-brand/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-indigo-400">
                Project Badge
              </p>
              <h4 className="mb-2 text-lg font-bold text-white">{projectTitle}</h4>
              <div className="inline-flex items-center rounded-md border border-brand bg-brand/10 px-2 py-1 text-xs font-bold uppercase text-indigo-400">
                {evaluation.tier_confirmed?.replace('tier', 'Tier ')}
              </div>
            </div>
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-brand bg-surface">
              <span className="text-2xl font-bold text-white">{evaluation.score_total}</span>
              <span className="text-xs text-zinc-500">/ 100</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={`/badge/${projectId}`} target="_blank" className="min-w-[140px] flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View Public Badge
          </Button>
        </Link>
        {badge.verification_id && (
          <Link
            href={`/verify/${badge.verification_id}`}
            target="_blank"
            className="min-w-[140px] flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              Verify Badge
            </Button>
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          Copy Link
        </Button>
      </div>
    </>
  )
}
