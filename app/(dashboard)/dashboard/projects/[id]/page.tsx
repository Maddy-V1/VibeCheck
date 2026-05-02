import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Github, Video, ArrowLeft, Share2, Clock } from 'lucide-react'
import { ProjectResultsPanel } from '@/components/features/evaluation/ProjectResultsPanel'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'
import { ProjectComments } from '@/components/features/community/project-comments'
import { getCommunityViewer } from '@/lib/community/server'

const TIER_VARIANT: Record<string, 'tier1' | 'tier2' | 'tier3'> = {
  tier1: 'tier1',
  tier2: 'tier2',
  tier3: 'tier3',
}
const TIER_LABEL: Record<string, string> = {
  tier1: 'Tier 1 — Foundational',
  tier2: 'Tier 2 — Builder',
  tier3: 'Tier 3 — Architect',
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

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: project, error } = await supabase.from('projects').select('*').eq('id', id).single()

  if (error || !project) notFound()

  if (project.user_id !== user.id) {
    if (project.status === 'evaluated') redirect(`/badge/${project.id}`)
    redirect('/dashboard')
  }

  // Queue data
  let queueData = null
  if (project.status === 'in_queue' || project.status === 'evaluating') {
    const { data } = await supabase
      .from('queue')
      .select('position, estimated_days, plan')
      .eq('project_id', project.id)
      .single()
    queueData = data
  }

  // Evaluation
  let evaluation = null
  if (project.status === 'evaluated') {
    const { data } = await supabase
      .from('evaluations')
      .select('*, profiles:evaluator_id (username, display_name)')
      .eq('project_id', project.id)
      .single()
    evaluation = data
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single()

  const isEvaluated = Boolean(project.status === 'evaluated' && evaluation)
  const viewer = isEvaluated ? await getCommunityViewer() : null

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      {/* Header */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[project.status]?.className || ''}`}
          >
            {STATUS_CONFIG[project.status]?.label || project.status}
          </span>
          <Badge variant={TIER_VARIANT[project.tier] || 'secondary'}>
            {TIER_LABEL[project.tier] || project.tier}
          </Badge>
        </div>
        <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          {project.title}
          <TierBadgeImage
            tier={evaluation?.tier_confirmed || project.tier || 'tier1'}
            size={32}
            className="shrink-0"
          />
        </h1>
        <p className="max-w-3xl text-[14px] leading-relaxed text-zinc-400">{project.description}</p>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Queue Status */}
          {queueData && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Clock size={15} className="text-indigo-400" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-400">
                  Queue Position
                </p>
              </div>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums text-white">
                  #{queueData.position}
                </span>
              </div>
              {queueData.estimated_days && (
                <p className="text-[13px] text-zinc-500">
                  Estimated ~{queueData.estimated_days} days
                </p>
              )}
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.max(10, Math.min(90, 100 - queueData.position * 5))}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-700">
                We'll notify you when your evaluation is ready.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <a href={project.live_url} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <ExternalLink size={13} className="mr-1.5" /> View Live
              </Button>
            </a>
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  <Github size={13} className="mr-1.5" /> Source Code
                </Button>
              </a>
            )}
            {project.demo_video_url && (
              <a href={project.demo_video_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  <Video size={13} className="mr-1.5" /> Demo Video
                </Button>
              </a>
            )}
            {isEvaluated && (
              <Link href={`/badge/${project.id}`} target="_blank">
                <Button variant="secondary" size="sm">
                  <Share2 size={13} className="mr-1.5" /> Public Badge
                </Button>
              </Link>
            )}
          </div>

          {/* Tech Stack */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Tech Stack
            </h3>
            {project.tech_stack && project.tech_stack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech: string) => (
                  <span
                    key={tech}
                    className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[12px] text-zinc-400"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-zinc-700">No tech stack specified</p>
            )}
          </div>

          {/* Submission Details */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-0.5 text-[11px] text-zinc-600">Created</p>
                <p className="text-[13px] text-white">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {project.queue_entered_at && (
                <div>
                  <p className="mb-0.5 text-[11px] text-zinc-600">Entered Queue</p>
                  <p className="text-[13px] text-white">
                    {new Date(project.queue_entered_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-0.5 text-[11px] text-zinc-600">Slug</p>
                <p className="font-mono text-[13px] text-zinc-400">{project.slug}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[11px] text-zinc-600">Visibility</p>
                <p className="text-[13px] text-zinc-400">
                  {project.is_public ? 'Public' : 'Private'}
                </p>
              </div>
            </div>
          </div>

          {isEvaluated && viewer ? (
            <ProjectComments
              projectId={project.id}
              projectOwnerId={project.user_id}
              viewer={viewer}
            />
          ) : null}
        </div>

        {/* Right Column - Results Panel */}
        {isEvaluated && evaluation && (
          <div className="lg:col-span-1">
            <ProjectResultsPanel
              evaluation={evaluation}
              project={project}
              username={profile?.username || undefined}
              displayName={profile?.display_name || undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}
