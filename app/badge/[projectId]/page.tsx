import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Github, Video, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicResultsPanel } from '@/components/features/evaluation/PublicResultsPanel'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'
import { ProjectComments } from '@/components/features/community/project-comments'
import { RelatedProjects } from '@/components/features/community/related-projects'
import { getCommunityViewer } from '@/lib/community/server'

const TIER_CONFIG = {
  tier1: { label: 'Tier 1 — Foundational', color: 'text-tier-1 border-tier-1 bg-tier-1/10' },
  tier2: { label: 'Tier 2 — Builder', color: 'text-tier-2 border-tier-2 bg-tier-2/10' },
  tier3: { label: 'Tier 3 — Architect', color: 'text-tier-3 border-tier-3 bg-tier-3/10' },
}

export default async function PublicBadgePage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = createServiceClient()
  const viewer = await getCommunityViewer()

  // Fetch project - must be public and evaluated
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('is_public', true)
    .eq('status', 'evaluated')
    .single()

  if (!project) {
    notFound()
  }

  // Fetch evaluation with evaluator profile
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select(
      `
      *,
      profiles:evaluator_id (
        username,
        display_name
      )
    `
    )
    .eq('project_id', projectId)
    .single()

  if (!evaluation) {
    notFound()
  }

  // Fetch project owner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', project.user_id)
    .single()

  // Fetch other community projects (excluding current one)
  const { data: relatedProjectRows } = await supabase
    .from('projects')
    .select(
      `
      id,
      title,
      description,
      tech_stack,
      tier,
      live_url,
      comment_count,
      user_id,
      profiles!projects_user_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      evaluations!evaluations_project_id_fkey (
        score_total,
        evaluated_at
      )
    `
    )
    .eq('is_public', true)
    .eq('status', 'evaluated')
    .neq('id', projectId)
    .order('created_at', { ascending: false })
    .limit(6)

  const relatedProjects = (relatedProjectRows ?? [])
    .filter((p) => {
      const eval_ = Array.isArray(p.evaluations) ? p.evaluations[0] : p.evaluations
      return eval_ && eval_.score_total != null
    })
    .map((p) => {
      const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      const eval_ = Array.isArray(p.evaluations) ? p.evaluations[0] : p.evaluations
      return {
        projectId: p.id,
        title: p.title,
        description: p.description,
        techStack: p.tech_stack || [],
        tier: p.tier,
        score: eval_!.score_total,
        liveUrl: p.live_url,
        username: profileData?.username ?? null,
        displayName: profileData?.display_name ?? null,
        avatarUrl: profileData?.avatar_url ?? null,
        evaluatedAt: eval_!.evaluated_at,
        commentCount: p.comment_count,
      }
    })

  return (
    <div className="min-h-screen bg-black p-6 py-8">
      {/* Back Button */}
      <div className="mx-auto mb-6 max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Project Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <div>
            <h1 className="mb-3 flex items-center gap-3 text-4xl font-bold text-white">
              {project.title}
              <TierBadgeImage tier={evaluation.tier_confirmed} size={40} />
            </h1>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest ${TIER_CONFIG[project.tier as keyof typeof TIER_CONFIG].color}`}
              >
                <TierBadgeImage tier={project.tier} size={16} />
                {TIER_CONFIG[project.tier as keyof typeof TIER_CONFIG].label}
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                Evaluated
              </span>
            </div>
            <p className="mb-2 leading-relaxed text-zinc-500">{project.description}</p>
            {profile && (
              <p className="text-sm text-zinc-600">
                by{' '}
                <Link
                  href={`/u/${profile.username}`}
                  className="text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  @{profile.username}
                </Link>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <a href={project.live_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live Project
              </Button>
            </a>
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Github className="mr-2 h-4 w-4" />
                  Source Code
                </Button>
              </a>
            )}
            {project.demo_video_url && (
              <a href={project.demo_video_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Video className="mr-2 h-4 w-4" />
                  Demo Video
                </Button>
              </a>
            )}
          </div>

          {/* Tech Stack */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">
              Tech Stack
            </h3>
            {project.tech_stack && project.tech_stack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech: string) => (
                  <span
                    key={tech}
                    className="rounded-md border border-white/[0.08] bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-500"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No tech stack specified</p>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">
              Project Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mb-1 text-zinc-600">Submitted</p>
                <p className="text-white">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="mb-1 text-zinc-600">Evaluated</p>
                <p className="text-white">
                  {new Date(evaluation.evaluated_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Comments — Preview mode: 2 comments + see more */}
          <ProjectComments
            projectId={project.id}
            projectOwnerId={project.user_id}
            viewer={viewer}
            previewMode
          />

          {/* Related Community Projects */}
          <RelatedProjects projects={relatedProjects} />
        </div>

        {/* Right Column - Results Panel */}
        <div className="lg:col-span-1">
          <PublicResultsPanel
            evaluation={evaluation}
            project={project}
            username={profile?.username || undefined}
            displayName={profile?.display_name || undefined}
          />
        </div>
      </div>
    </div>
  )
}
