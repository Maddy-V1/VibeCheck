'use client'

import Link from 'next/link'
import { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  FolderOpen,
  Trophy,
  Star,
  Award,
  Plus,
  ArrowRight,
  ExternalLink,
  Github,
  Clock,
  CheckCircle2,
  Bell,
} from 'lucide-react'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'
import { RankedProjectList } from '@/components/features/leaderboard/ranked-project-list'
import type { RankedProject } from '@/lib/utils/leaderboard'

interface UnlockedDashboardProps {
  profile: Profile
  projects: any[]
  notifications: any[]
  leaderboards: {
    weekly: RankedProject[]
    monthly: RankedProject[]
  }
}

export function UnlockedDashboard({
  profile,
  projects,
  notifications,
  leaderboards,
}: UnlockedDashboardProps) {
  const evaluatedProjects = projects.filter((p) => p.status === 'evaluated')
  const inQueueProjects = projects.filter(
    (p) => p.status === 'in_queue' || p.status === 'evaluating'
  )
  const draftProjects = projects.filter((p) => p.status === 'draft')

  // Calculate avg score
  const avgScore =
    evaluatedProjects.length > 0
      ? Math.round(
          evaluatedProjects.reduce((sum, p) => {
            // Try to get score - it might be on evaluations relation or direct
            return sum + (p.evaluations?.[0]?.score_total || 0)
          }, 0) / evaluatedProjects.length
        )
      : 0

  const unreadNotifications = notifications.filter((n) => !n.is_read)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Welcome back, {profile.display_name || 'there'}
          </p>
        </div>
        <Link href="/dashboard/submit">
          <Button>
            <Plus size={14} className="mr-1.5" />
            Submit Project
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Projects',
            value: evaluatedProjects.length,
            detail: `${projects.length} total`,
            icon: <FolderOpen size={15} className="text-indigo-400" />,
          },
          {
            label: 'Avg Score',
            value: avgScore > 0 ? `${avgScore}` : '—',
            detail: avgScore > 0 ? 'out of 100' : 'No evaluations',
            icon: <Star size={15} className="text-amber-400" />,
          },
          {
            label: 'Profile Rating',
            value: profile.profile_rating ? `${Number(profile.profile_rating).toFixed(0)}` : '—',
            detail:
              evaluatedProjects.length >= 3
                ? 'across all projects'
                : `${3 - evaluatedProjects.length} more to unlock`,
            icon: <Trophy size={15} className="text-emerald-400" />,
          },
          {
            label: 'Badges',
            value: evaluatedProjects.length,
            detail: 'earned',
            icon: <Award size={15} className="text-violet-400" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                {stat.label}
              </p>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold tabular-nums text-white">{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-zinc-600">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* In Queue Alert */}
      {inQueueProjects.length > 0 && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock size={14} className="text-indigo-400" />
            <p className="text-[13px] font-semibold text-indigo-400">
              {inQueueProjects.length} project{inQueueProjects.length > 1 ? 's' : ''} in queue
            </p>
          </div>
          <div className="space-y-2">
            {inQueueProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]"
              >
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                    {project.title}
                    <TierBadgeImage
                      tier={project.evaluations?.[0]?.tier_confirmed || project.tier}
                      size={14}
                    />
                  </p>
                  <p className="text-[11px] text-zinc-600">
                    Position #{project.queue?.[0]?.position || '—'} · Est. ~
                    {project.queue?.[0]?.estimated_days || '?'} days
                  </p>
                </div>
                <ArrowRight size={14} className="text-zinc-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RankedProjectList
          title="Weekly Top 10"
          eyebrow="Dashboard"
          description="The evaluator team’s selected highlights from this week."
          items={leaderboards.weekly}
          emptyMessage="The weekly top 10 has not been selected yet."
          maxHeightClassName="max-h-[28rem]"
        />
        <RankedProjectList
          title="Monthly Top 50"
          eyebrow="Dashboard"
          description="A running board of the strongest monthly evaluated projects."
          items={leaderboards.monthly}
          emptyMessage="The monthly top 50 has not been selected yet."
          maxHeightClassName="max-h-[28rem]"
        />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">Recent Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-[12px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            View all →
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-10 text-center">
            <FolderOpen size={24} className="mx-auto mb-3 text-zinc-700" />
            <p className="mb-4 text-[13px] text-zinc-500">No projects yet</p>
            <Link href="/dashboard/submit">
              <Button size="sm">Submit Your First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="group rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                {/* Status + Tier */}
                <div className="mb-3 flex items-center gap-2">
                  <ProjectStatusBadge status={project.status} />
                  <TierBadge tier={project.tier} />
                </div>

                <h3 className="mb-1 line-clamp-1 flex items-center gap-1.5 text-[14px] font-semibold text-white transition-colors group-hover:text-indigo-300">
                  <span className="truncate">{project.title}</span>
                  <TierBadgeImage
                    tier={project.evaluations?.[0]?.tier_confirmed || project.tier}
                    size={14}
                    className="shrink-0"
                  />
                </h3>
                <p className="mb-3 line-clamp-2 text-[12px] text-zinc-600">{project.description}</p>

                {/* Score (if evaluated) */}
                {project.status === 'evaluated' && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] p-2">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span className="text-[12px] font-semibold text-emerald-400">
                      Score: {project.evaluations?.[0]?.score_total || '—'}/100
                    </span>
                  </div>
                )}

                {/* Queue position */}
                {(project.status === 'in_queue' || project.status === 'evaluating') &&
                  project.queue?.[0] && (
                    <div className="flex items-center gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] p-2">
                      <Clock size={13} className="text-indigo-400" />
                      <span className="text-[12px] font-medium text-indigo-400">
                        Queue #{project.queue[0].position}
                      </span>
                    </div>
                  )}

                {/* Draft CTA */}
                {project.status === 'draft' && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
                    <span className="text-[12px] text-zinc-500">Draft — Complete & Submit</span>
                  </div>
                )}

                {/* Links */}
                <div className="mt-3 flex items-center gap-3 text-zinc-700">
                  {project.live_url && <ExternalLink size={12} />}
                  {project.github_url && <Github size={12} />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">Notifications</h2>
          <div className="flex items-center gap-3">
            {unreadNotifications.length > 0 && (
              <span className="text-[11px] font-medium text-indigo-400">
                {unreadNotifications.length} unread
              </span>
            )}
            <Link
              href="/dashboard/notifications"
              className="text-[12px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all →
            </Link>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-8 text-center">
            <Bell size={20} className="mx-auto mb-2 text-zinc-700" />
            <p className="text-[13px] text-zinc-500">No notifications yet</p>
            <p className="mt-1 text-[11px] text-zinc-700">
              We'll let you know when something happens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-white/[0.025]">
            {notifications.slice(0, 5).map((notif) => (
              <Link
                key={notif.id}
                href={notif.link || '#'}
                className={`flex items-start gap-3 p-4 transition-colors hover:bg-white/[0.03] ${!notif.is_read ? 'bg-indigo-500/[0.03]' : ''}`}
              >
                <div
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!notif.is_read ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">{notif.title}</p>
                  {notif.body && (
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-zinc-500">{notif.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-700">
                    {new Date(notif.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* Helper components */
function ProjectStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'border-zinc-700/50 bg-zinc-800/50 text-zinc-500' },
    submitted: {
      label: 'Submitted',
      className: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
    },
    in_queue: {
      label: 'In Queue',
      className: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
    },
    evaluating: {
      label: 'Evaluating',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    },
    evaluated: {
      label: 'Evaluated',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    },
    rejected: { label: 'Rejected', className: 'border-red-500/20 bg-red-500/10 text-red-400' },
  }
  const c = config[status] || config.draft!
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.className}`}
    >
      {c.label}
    </span>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; className: string }> = {
    tier1: {
      label: 'Tier 1',
      className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    },
    tier2: { label: 'Tier 2', className: 'border-sky-500/25 bg-sky-500/10 text-sky-400' },
    tier3: { label: 'Tier 3', className: 'border-violet-500/25 bg-violet-500/10 text-violet-400' },
  }
  const c = config[tier] || config.tier1!
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.className}`}
    >
      {c.label}
    </span>
  )
}
