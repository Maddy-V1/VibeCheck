'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'
import { MessageCircle, ExternalLink } from 'lucide-react'

interface RelatedProject {
  projectId: string
  title: string
  description: string | null
  techStack: string[]
  tier: string
  score: number
  liveUrl: string | null
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  evaluatedAt: string
  commentCount: number
}

interface RelatedProjectsProps {
  projects: RelatedProject[]
}

const TIER_LABELS: Record<string, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
}

function getTierVariant(tier: string) {
  if (tier === 'tier1') return 'tier1'
  if (tier === 'tier2') return 'tier2'
  if (tier === 'tier3') return 'tier3'
  return 'secondary'
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="relative flex h-11 w-11 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(rgba(129, 140, 248, 0.95) ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">
        {Math.round(score)}
      </div>
    </div>
  )
}

export function RelatedProjects({ projects }: RelatedProjectsProps) {
  if (projects.length === 0) return null

  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6">
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
          From the Community
        </p>
        <h2 className="text-xl font-semibold text-white">More evaluated projects</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.projectId}
            href={`/badge/${project.projectId}`}
            className="group flex flex-col rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 transition-all hover:-translate-y-0.5 hover:border-white/[0.14]"
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <ScoreRing score={project.score} />
              <Badge variant={getTierVariant(project.tier)}>
                <TierBadgeImage tier={project.tier} size={12} className="mr-1" />
                {TIER_LABELS[project.tier] ?? 'Tier'}
              </Badge>
            </div>

            {/* Title & description */}
            <h3 className="mb-1 line-clamp-1 text-[14px] font-semibold text-white group-hover:text-indigo-300">
              {project.title}
            </h3>
            <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-[12px] leading-relaxed text-zinc-500">
              {project.description || 'No description provided.'}
            </p>

            {/* Tech stack */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {project.techStack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-500"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-600">
                  +{project.techStack.length - 3}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-zinc-600">
              <div className="flex items-center gap-2">
                {project.avatarUrl ? (
                  <img
                    src={project.avatarUrl}
                    alt={project.displayName || project.username || ''}
                    className="h-5 w-5 rounded-full border border-white/[0.08] object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[9px] font-semibold text-white">
                    {(project.displayName || project.username || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-zinc-400">@{project.username || 'member'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} />
                  {project.commentCount}
                </span>
                {project.liveUrl && <ExternalLink size={11} />}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
