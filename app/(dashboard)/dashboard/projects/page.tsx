import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Plus,
  ExternalLink,
  Github,
  Video,
  Clock,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  Sparkles,
  FileText,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'

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

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
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

export default async function MyProjectsPage() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch queue data
  const inQueueIds =
    projects
      ?.filter((p) => p.status === 'in_queue' || p.status === 'evaluating')
      .map((p) => p.id) || []
  const queueMap = new Map<string, any>()
  if (inQueueIds.length > 0) {
    const { data: queueData } = await supabase
      .from('queue')
      .select('project_id, position, estimated_days, plan')
      .in('project_id', inQueueIds)
    queueData?.forEach((q) => queueMap.set(q.project_id, q))
  }

  // Fetch evaluations
  const evaluatedIds = projects?.filter((p) => p.status === 'evaluated').map((p) => p.id) || []
  const evalMap = new Map<string, any>()
  if (evaluatedIds.length > 0) {
    const { data: evals } = await supabase
      .from('evaluations')
      .select('project_id, score_total, tier_confirmed')
      .in('project_id', evaluatedIds)
    evals?.forEach((e) => evalMap.set(e.project_id, e))
  }

  const all = projects || []
  const inQueue = all.filter((p) => p.status === 'in_queue' || p.status === 'evaluating')
  const evaluated = all.filter((p) => p.status === 'evaluated')
  const drafts = all.filter((p) => p.status === 'draft')

  const avgScore =
    evaluated.length > 0
      ? Math.round(
          evaluated.reduce((sum, p) => sum + (evalMap.get(p.id)?.score_total || 0), 0) /
            evaluated.length
        )
      : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Projects</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Manage your submissions and track evaluation progress
          </p>
        </div>
        <Link href="/dashboard/submit">
          <Button>
            <Plus size={14} className="mr-1.5" />
            Submit New
          </Button>
        </Link>
      </div>

      {/* ——— Stats cards ——— */}
      {all.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Total',
              value: all.length,
              icon: <FolderOpen size={14} />,
              iconBg: 'bg-indigo-500/15 text-indigo-400',
            },
            {
              label: 'In Queue',
              value: inQueue.length,
              icon: <Clock size={14} />,
              iconBg: 'bg-sky-500/15 text-sky-400',
            },
            {
              label: 'Evaluated',
              value: evaluated.length,
              icon: <CheckCircle2 size={14} />,
              iconBg: 'bg-emerald-500/15 text-emerald-400',
            },
            {
              label: 'Avg Score',
              value: avgScore > 0 ? avgScore : '—',
              icon: <BarChart3 size={14} />,
              iconBg: 'bg-amber-500/15 text-amber-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition-all hover:border-white/[0.12]"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  {stat.label}
                </p>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${stat.iconBg}`}
                >
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ——— In Queue section ——— */}
      {inQueue.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.06] to-violet-500/[0.03] p-5">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }}
          />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20">
                <Clock size={13} className="text-indigo-400" />
              </div>
              <h2 className="text-[14px] font-semibold text-indigo-300">
                In Queue ({inQueue.length})
              </h2>
            </div>
            <div className="space-y-2">
              {inQueue.map((project) => {
                const queue = queueMap.get(project.id)
                return (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="group/q flex items-center justify-between rounded-xl bg-white/[0.04] p-4 transition-all hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                        <span className="text-[14px] font-bold text-indigo-300">
                          #{queue?.position || '—'}
                        </span>
                      </div>
                      <div>
                        <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
                          {project.title}
                          <TierBadgeImage tier={project.tier} size={14} />
                        </p>
                        {queue && (
                          <p className="mt-0.5 text-[12px] text-zinc-500">
                            Estimated ~{queue.estimated_days || '?'} days until evaluation
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-zinc-700 transition-all group-hover/q:translate-x-0.5 group-hover/q:text-indigo-400"
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ——— All Projects ——— */}
      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15">
            <Sparkles size={13} className="text-indigo-400" />
          </div>
          <h2 className="text-[15px] font-semibold text-white">All Projects ({all.length})</h2>
        </div>

        {all.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-14 text-center">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.06), transparent 50%)',
              }}
            />
            <FolderOpen size={32} className="relative mx-auto mb-3 text-zinc-600" />
            <h3 className="relative mb-1 text-[15px] font-semibold text-white">No projects yet</h3>
            <p className="relative mb-5 text-[13px] text-zinc-500">
              Your first project is one step away
            </p>
            <Link href="/dashboard/submit">
              <Button>Submit Your First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {all.map((project) => {
              const evaluation = evalMap.get(project.id)
              const queue = queueMap.get(project.id)
              const status = STATUS_META[project.status] || STATUS_META.draft!
              const isEvaluated = project.status === 'evaluated'
              const isQueued = project.status === 'in_queue' || project.status === 'evaluating'

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-xl hover:shadow-black/30"
                >
                  {/* Gradient header bar */}
                  <div
                    className="h-1 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${status.color}50, ${status.color}10, transparent)`,
                    }}
                  />

                  <div className="flex flex-1 flex-col p-5">
                    {/* Status + score */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.bgClass}`}
                        >
                          {status.label}
                        </span>
                        <TierBadgeImage
                          tier={evaluation?.tier_confirmed || project.tier}
                          size={16}
                          className="opacity-80"
                        />
                      </div>
                      {isEvaluated && evaluation && (
                        <ScoreRing score={evaluation.score_total} size={44} />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mb-1.5 line-clamp-1 text-[15px] font-semibold text-white transition-colors group-hover:text-indigo-300">
                      {project.title}
                    </h3>
                    <p className="mb-auto line-clamp-2 min-h-[2.5rem] text-[12px] leading-relaxed text-zinc-600">
                      {project.description}
                    </p>

                    {/* Contextual info */}
                    <div className="mt-4 space-y-2.5">
                      {/* Evaluated — score bar */}
                      {isEvaluated && evaluation && (
                        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-400" />
                              <span className="text-[11px] font-semibold text-emerald-400">
                                Score: {evaluation.score_total}/100
                              </span>
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`h-1 w-3 rounded-full ${
                                    i < Math.round(evaluation.score_total / 20)
                                      ? 'bg-emerald-400'
                                      : 'bg-white/[0.06]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${evaluation.score_total}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Queue */}
                      {isQueued && queue && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-2.5">
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                          <span className="text-[11px] font-semibold text-indigo-400">
                            Queue #{queue.position}
                          </span>
                          <span className="text-[10px] text-indigo-400/60">
                            · ~{queue.estimated_days || '?'}d
                          </span>
                        </div>
                      )}

                      {/* Draft */}
                      {project.status === 'draft' && (
                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                          <FileText size={12} className="text-zinc-600" />
                          <span className="text-[11px] text-zinc-500">
                            Draft — Complete & Submit →
                          </span>
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex items-center justify-between text-zinc-700">
                        <div className="flex items-center gap-2">
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
                          {project.demo_video_url && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] transition-colors group-hover:bg-white/[0.08]">
                              <Video size={11} />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-800">
                          {new Date(project.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
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
      </section>
    </div>
  )
}
