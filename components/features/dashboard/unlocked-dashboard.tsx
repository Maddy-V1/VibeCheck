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
  Sparkles,
  FileText,
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

/* ——— Score Ring ——— */
function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const pct = Math.min(score, 100)
  const hue = pct < 40 ? 0 : pct < 70 ? 45 : 145
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(hsla(${hue},80%,55%,0.85) ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-zinc-950 text-xs font-bold tabular-nums text-white"
        style={{ width: size - 10, height: size - 10 }}
      >
        {Math.round(score)}
      </div>
    </div>
  )
}

/* ——— Status indicator ——— */
const STATUS_META: Record<string, { label: string; color: string; bgClass: string }> = {
  draft: {
    label: 'Draft',
    color: '#71717a',
    bgClass: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500',
  },
  submitted: {
    label: 'Submitted',
    color: '#818cf8',
    bgClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  },
  in_queue: {
    label: 'In Queue',
    color: '#818cf8',
    bgClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  },
  evaluating: {
    label: 'Evaluating',
    color: '#fbbf24',
    bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
  evaluated: {
    label: 'Evaluated',
    color: '#34d399',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    color: '#f87171',
    bgClass: 'bg-red-500/10 border-red-500/20 text-red-400',
  },
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

  const avgScore =
    evaluatedProjects.length > 0
      ? Math.round(
          evaluatedProjects.reduce((sum, p) => sum + (p.evaluations?.[0]?.score_total || 0), 0) /
            evaluatedProjects.length
        )
      : 0

  const unreadNotifications = notifications.filter((n) => !n.is_read)

  return (
    <div className="space-y-8">
      {/* Hero header */}
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

      {/* ——— Stats row with glass cards ——— */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Projects',
            value: evaluatedProjects.length,
            detail: `${projects.length} total`,
            icon: <FolderOpen size={15} />,
            gradient: 'from-indigo-500/20 to-indigo-600/5',
            iconBg: 'bg-indigo-500/15 text-indigo-400',
          },
          {
            label: 'Avg Score',
            value: avgScore > 0 ? `${avgScore}` : '—',
            detail: avgScore > 0 ? 'out of 100' : 'No evaluations',
            icon: <Star size={15} />,
            gradient: 'from-amber-500/20 to-amber-600/5',
            iconBg: 'bg-amber-500/15 text-amber-400',
          },
          {
            label: 'Profile Rating',
            value: profile.profile_rating ? `${Number(profile.profile_rating).toFixed(0)}` : '—',
            detail:
              evaluatedProjects.length >= 3
                ? 'across all projects'
                : `${3 - evaluatedProjects.length} more to unlock`,
            icon: <Trophy size={15} />,
            gradient: 'from-emerald-500/20 to-emerald-600/5',
            iconBg: 'bg-emerald-500/15 text-emerald-400',
          },
          {
            label: 'Badges',
            value: evaluatedProjects.length,
            detail: 'earned',
            icon: <Award size={15} />,
            gradient: 'from-violet-500/20 to-violet-600/5',
            iconBg: 'bg-violet-500/15 text-violet-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition-all duration-300 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20"
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-60"
              style={{
                background: `radial-gradient(circle, var(--tw-gradient-stops))`,
              }}
            />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  {stat.label}
                </p>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.iconBg}`}
                >
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums text-white">{stat.value}</p>
              <p className="mt-0.5 text-[11px] text-zinc-600">{stat.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ——— In Queue Alert ——— */}
      {inQueueProjects.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.06] to-violet-500/[0.03] p-5">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent)' }}
          />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
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
                  className="group/q flex items-center justify-between rounded-xl bg-white/[0.04] p-3.5 transition-all duration-200 hover:bg-white/[0.07]"
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                      {project.title}
                      <TierBadgeImage
                        tier={project.evaluations?.[0]?.tier_confirmed || project.tier}
                        size={14}
                      />
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      Position #{project.queue?.[0]?.position || '—'} · Est. ~
                      {project.queue?.[0]?.estimated_days || '?'} days
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-zinc-700 transition-all group-hover/q:translate-x-0.5 group-hover/q:text-indigo-400"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ——— Leaderboards ——— */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RankedProjectList
          title="Weekly Top 10"
          eyebrow="Dashboard"
          description="The evaluator team's selected highlights from this week."
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

      {/* ——— Recent Projects — premium card redesign ——— */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15">
              <Sparkles size={13} className="text-indigo-400" />
            </div>
            <h2 className="text-[15px] font-semibold text-white">Recent Projects</h2>
          </div>
          <Link
            href="/dashboard/projects"
            className="text-[12px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            View all →
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-12 text-center">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.06), transparent 50%)',
              }}
            />
            <FolderOpen size={28} className="relative mx-auto mb-3 text-zinc-600" />
            <p className="relative mb-4 text-[13px] text-zinc-500">No projects yet</p>
            <Link href="/dashboard/submit">
              <Button size="sm">Submit Your First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => {
              const status = STATUS_META[project.status] || STATUS_META.draft!
              const score = project.evaluations?.[0]?.score_total
              const queuePos = project.queue?.[0]?.position
              const isEvaluated = project.status === 'evaluated'
              const isQueued = project.status === 'in_queue' || project.status === 'evaluating'

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-xl hover:shadow-black/30"
                >
                  {/* Gradient header accent */}
                  <div
                    className="h-1 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${status.color}40, transparent)`,
                    }}
                  />

                  <div className="flex flex-1 flex-col p-5">
                    {/* Top row: status + score ring */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.bgClass}`}
                        >
                          {status.label}
                        </span>
                        <TierBadgeImage
                          tier={project.evaluations?.[0]?.tier_confirmed || project.tier}
                          size={16}
                          className="opacity-80"
                        />
                      </div>
                      {isEvaluated && score != null && <ScoreRing score={score} size={42} />}
                    </div>

                    {/* Title */}
                    <h3 className="mb-1.5 line-clamp-1 text-[15px] font-semibold text-white transition-colors group-hover:text-indigo-300">
                      {project.title}
                    </h3>
                    <p className="mb-auto line-clamp-2 min-h-[2.5rem] text-[12px] leading-relaxed text-zinc-600">
                      {project.description}
                    </p>

                    {/* Bottom info */}
                    <div className="mt-4 space-y-3">
                      {/* Queue indicator */}
                      {isQueued && queuePos && (
                        <div className="flex items-center gap-2 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-2">
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                          <span className="text-[11px] font-semibold text-indigo-400">
                            Queue #{queuePos}
                          </span>
                          <span className="text-[10px] text-indigo-400/60">
                            · ~{project.queue?.[0]?.estimated_days || '?'}d
                          </span>
                        </div>
                      )}

                      {/* Draft indicator */}
                      {project.status === 'draft' && (
                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                          <FileText size={12} className="text-zinc-600" />
                          <span className="text-[11px] text-zinc-500">
                            Draft — Complete & Submit
                          </span>
                        </div>
                      )}

                      {/* Links & date row */}
                      <div className="flex items-center justify-between text-zinc-700">
                        <div className="flex items-center gap-2.5">
                          {project.live_url && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] transition-colors group-hover:bg-white/[0.08]">
                              <ExternalLink size={11} />
                            </span>
                          )}
                          {project.github_url && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] transition-colors group-hover:bg-white/[0.08]">
                              <Github size={11} />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-800">
                          {new Date(project.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ——— Notifications with timeline spine ——— */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
              <Bell size={13} className="text-violet-400" />
            </div>
            <h2 className="text-[15px] font-semibold text-white">Notifications</h2>
          </div>
          <div className="flex items-center gap-3">
            {unreadNotifications.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500/20 px-1.5 text-[10px] font-bold text-indigo-300">
                {unreadNotifications.length}
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
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-10 text-center">
            <Bell size={22} className="mx-auto mb-2 text-zinc-700" />
            <p className="text-[13px] text-zinc-500">No notifications yet</p>
            <p className="mt-1 text-[11px] text-zinc-700">
              We&apos;ll let you know when something happens.
            </p>
          </div>
        ) : (
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            {/* Timeline spine */}
            <div className="absolute bottom-5 left-[39px] top-5 w-px bg-gradient-to-b from-white/[0.1] via-white/[0.04] to-transparent" />

            <div className="space-y-1">
              {notifications.slice(0, 5).map((notif) => {
                const ICON_MAP: Record<string, typeof Bell> = {
                  evaluation_complete: CheckCircle2,
                  badge_earned: Award,
                  comment: Bell,
                  reaction: Star,
                }
                const NIcon = ICON_MAP[notif.type] || Bell
                const isUnread = !notif.is_read

                return (
                  <Link
                    key={notif.id}
                    href={notif.link || '/dashboard/notifications'}
                    className={`group/n flex items-start gap-3.5 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.03] ${isUnread ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900">
                      <NIcon size={13} className={isUnread ? 'text-indigo-400' : 'text-zinc-600'} />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className={`text-[13px] font-medium ${isUnread ? 'text-white' : 'text-zinc-500'}`}
                      >
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-700">
                          {notif.body}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-zinc-800">
                        {new Date(notif.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
