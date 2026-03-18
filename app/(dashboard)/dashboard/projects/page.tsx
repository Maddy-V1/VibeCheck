import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  ExternalLink,
  Github,
  Video,
  Clock,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
} from 'lucide-react'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'

const TIER_VARIANT: Record<string, 'tier1' | 'tier2' | 'tier3'> = {
  tier1: 'tier1',
  tier2: 'tier2',
  tier3: 'tier3',
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
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

  return (
    <div className="space-y-6">
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

      {/* Quick Stats */}
      {all.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: all.length, color: 'text-white' },
            { label: 'In Queue', value: inQueue.length, color: 'text-indigo-400' },
            { label: 'Evaluated', value: evaluated.length, color: 'text-emerald-400' },
            { label: 'Drafts', value: drafts.length, color: 'text-zinc-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* In Queue Section */}
      {inQueue.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-white">In Queue</h2>
          <div className="space-y-2">
            {inQueue.map((project) => {
              const queue = queueMap.get(project.id)
              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center justify-between rounded-xl border border-indigo-500/15 bg-indigo-500/[0.03] p-4 transition-colors hover:bg-indigo-500/[0.06]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[project.status]?.className}`}
                      >
                        {STATUS_CONFIG[project.status]?.label}
                      </span>
                      <Badge variant={TIER_VARIANT[project.tier] || 'secondary'}>
                        {project.tier?.replace('tier', 'Tier ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-[14px] font-semibold text-white">
                        {project.title}
                        <TierBadgeImage tier={project.tier} size={14} />
                      </p>
                      {queue && (
                        <p className="mt-0.5 text-[12px] text-zinc-500">
                          Position #{queue.position} · Est. ~{queue.estimated_days || '?'} days
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* All Projects */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-white">All Projects ({all.length})</h2>

        {all.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-12 text-center">
            <FolderOpen size={28} className="mx-auto mb-3 text-zinc-700" />
            <h3 className="mb-1 text-[15px] font-semibold text-white">No projects yet</h3>
            <p className="mb-5 text-[13px] text-zinc-500">Your first project is one step away</p>
            <Link href="/dashboard/submit">
              <Button>Submit Your First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {all.map((project) => {
              const evaluation = evalMap.get(project.id)
              const queue = queueMap.get(project.id)
              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="group block rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  {/* Badges */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[project.status]?.className || STATUS_CONFIG.draft?.className || ''}`}
                    >
                      {STATUS_CONFIG[project.status]?.label || 'Unknown'}
                    </span>
                    <Badge variant={TIER_VARIANT[project.tier] || 'secondary'}>
                      {project.tier?.replace('tier', 'Tier ')}
                    </Badge>
                  </div>

                  <h3 className="mb-1 line-clamp-1 flex items-center gap-1.5 text-[14px] font-semibold text-white transition-colors group-hover:text-indigo-300">
                    <span className="truncate">{project.title}</span>
                    <TierBadgeImage
                      tier={evaluation?.tier_confirmed || project.tier}
                      size={14}
                      className="shrink-0"
                    />
                  </h3>
                  <p className="mb-3 line-clamp-2 min-h-[32px] text-[12px] text-zinc-600">
                    {project.description}
                  </p>

                  {/* Score */}
                  {project.status === 'evaluated' && evaluation && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] p-2.5">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span className="text-[12px] font-semibold text-emerald-400">
                        Score: {evaluation.score_total}/100
                      </span>
                      <div className="ml-auto flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={
                              i < Math.round(evaluation.score_total / 20)
                                ? 'text-emerald-400'
                                : 'text-zinc-800'
                            }
                          >
                            ●
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Queue */}
                  {(project.status === 'in_queue' || project.status === 'evaluating') && queue && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.06] p-2.5">
                      <Clock size={13} className="text-indigo-400" />
                      <span className="text-[12px] font-medium text-indigo-400">
                        Queue #{queue.position}
                      </span>
                    </div>
                  )}

                  {/* Draft */}
                  {project.status === 'draft' && (
                    <div className="mb-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
                      <span className="text-[12px] text-zinc-500">Draft — Complete & Submit →</span>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-3 text-zinc-700">
                    {project.live_url && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <ExternalLink size={11} /> Live
                      </span>
                    )}
                    {project.github_url && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Github size={11} /> Code
                      </span>
                    )}
                    {project.demo_video_url && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Video size={11} /> Demo
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-zinc-800">
                      {new Date(project.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
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
