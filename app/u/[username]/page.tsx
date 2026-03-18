import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileHeader } from '@/components/features/profile/ProfileHeader'
import { PublicProjectCard } from '@/components/features/profile/PublicProjectCard'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const supabase = await createServerComponentClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url, id')
    .eq('username', username)
    .eq('is_profile_public', true)
    .single()

  if (!profile) {
    return { title: 'Profile Not Found — VibeCheck' }
  }

  return {
    title: `${profile.display_name} (@${username}) — VibeCheck`,
    description: profile.bio ?? `${profile.display_name}'s vibe coding portfolio`,
    openGraph: {
      title: `${profile.display_name} (@${username})`,
      description: profile.bio ?? `${profile.display_name}'s vibe coding portfolio`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.display_name} (@${username})`,
      description: profile.bio ?? `${profile.display_name}'s vibe coding portfolio`,
    },
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createServerComponentClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  if (!profile.is_profile_public) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#52525B"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">This profile is private</h1>
          <p className="mb-6 text-[13px] text-zinc-500">
            @{username} hasn't made their profile public yet.
          </p>
          <Link
            href="/"
            className="text-[13px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Fetch public projects
  const { data: projects } = await supabase
    .from('projects')
    .select(
      'id, title, description, tech_stack, live_url, status, is_public, created_at, reaction_count, comment_count'
    )
    .eq('user_id', profile.id)
    .eq('is_public', true)

  // Fetch evaluations separately
  let projectsWithEvaluations: any[] = []
  if (projects && projects.length > 0) {
    const projectIds = projects.map((p) => p.id)
    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .in('project_id', projectIds)

    projectsWithEvaluations = projects.map((project) => ({
      ...project,
      evaluations: evaluations?.filter((e) => e.project_id === project.id) || [],
    }))
  }

  const evaluatedCount = projectsWithEvaluations.filter((p) => p.evaluations?.length > 0).length

  return (
    <div className="min-h-screen bg-black">
      {/* Subtle nav */}
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ArrowLeft size={13} /> VibeCheck
        </Link>
      </div>

      <ProfileHeader
        profile={{
          username: profile.username,
          display_name: profile.display_name ?? 'Anonymous',
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          github_username: profile.github_username,
          linkedin_url: profile.linkedin_url,
          profile_rating: profile.profile_rating ? Number(profile.profile_rating) : null,
          certificate_level: profile.certificate_level,
        }}
        evaluatedProjectCount={evaluatedCount}
      />

      {/* Projects Grid */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {projectsWithEvaluations.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-zinc-600">No public projects yet.</p>
          </div>
        ) : (
          <>
            <h2 className="mb-5 text-[15px] font-semibold text-white">
              Projects ({projectsWithEvaluations.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectsWithEvaluations.map((project) => (
                <PublicProjectCard
                  key={project.id}
                  project={project}
                  evaluation={project.evaluations?.[0] || null}
                  username={username}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
