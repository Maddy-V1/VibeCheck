'use client'

import Link from 'next/link'
import { ExternalLink, Heart, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'

interface PublicProjectCardProps {
  project: {
    id: string
    title: string
    description?: string | null
    tech_stack?: string[] | null
    live_url?: string | null
    reaction_count?: number
    comment_count?: number
    slug?: string | null
    status?: string
    tier?: string
  }
  evaluation: {
    score_total: number | string
    tier_confirmed: string
    evaluated_at: string
  } | null
  username: string
}

const TIER_VARIANT: Record<string, 'tier1' | 'tier2' | 'tier3'> = {
  tier1: 'tier1',
  tier2: 'tier2',
  tier3: 'tier3',
}

export function PublicProjectCard({ project, evaluation, username }: PublicProjectCardProps) {
  const isEvaluated = evaluation !== null

  return (
    <div className="group rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-white/[0.15]">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        {isEvaluated && evaluation ? (
          <>
            <Badge variant={TIER_VARIANT[evaluation.tier_confirmed] || 'secondary'}>
              {evaluation.tier_confirmed?.replace('tier', 'Tier ')}
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums text-white">
                {typeof evaluation.score_total === 'number'
                  ? evaluation.score_total.toFixed(0)
                  : Number(evaluation.score_total).toFixed(0)}
              </div>
              <div className="text-[10px] text-zinc-600">/ 100</div>
            </div>
          </>
        ) : (
          <Badge variant="secondary">
            {project.status === 'in_queue' && '⏳ In Queue'}
            {project.status === 'submitted' && '📝 Submitted'}
            {(!project.status || project.status === 'draft') && '📝 Draft'}
          </Badge>
        )}
      </div>

      {/* Info */}
      <h3 className="mb-1 line-clamp-1 flex items-center gap-1.5 text-[14px] font-semibold text-white transition-colors group-hover:text-indigo-300">
        <span className="truncate">{project.title}</span>
        <TierBadgeImage
          tier={evaluation?.tier_confirmed || project.tier || 'tier1'}
          size={14}
          className="shrink-0"
        />
      </h3>
      <p className="mb-3 line-clamp-2 min-h-[32px] text-[12px] text-zinc-600">
        {project.description || 'No description'}
      </p>

      {/* Tech Stack */}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {project.tech_stack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-500"
            >
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 4 && (
            <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-600">
              +{project.tech_stack.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Engagement */}
      <div className="mb-3 flex items-center gap-4 text-[11px] text-zinc-700">
        <span className="flex items-center gap-1">
          <Heart size={12} /> {project.reaction_count || 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={12} /> {project.comment_count || 0}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
        {project.live_url ? (
          <a
            href={project.live_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-indigo-400 transition-colors hover:text-indigo-300"
          >
            <ExternalLink size={11} /> Live
          </a>
        ) : (
          <span className="text-[11px] text-zinc-800">No URL</span>
        )}
        {isEvaluated && evaluation && (
          <span className="text-[10px] text-zinc-700">
            {formatDistanceToNow(new Date(evaluation.evaluated_at), { addSuffix: true })}
          </span>
        )}
      </div>

      {isEvaluated && (
        <Link
          href={`/badge/${project.id}`}
          className="mt-3 block text-center text-[11px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          View Badge →
        </Link>
      )}
    </div>
  )
}
