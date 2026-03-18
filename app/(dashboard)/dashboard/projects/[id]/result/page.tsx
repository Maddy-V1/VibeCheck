import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ScoreReveal } from '@/components/features/evaluation/ScoreReveal'

export default async function ProjectResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // Check if user owns this project
  if (project.user_id !== user.id) {
    redirect('/dashboard')
  }

  // Check if project has been evaluated
  if (project.status !== 'evaluated') {
    redirect(`/dashboard/projects/${id}`)
  }

  // Fetch evaluation separately
  const { data: evaluation, error: evalError } = await supabase
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
    .eq('project_id', id)
    .single()

  if (evalError || !evaluation) {
    redirect(`/dashboard/projects/${id}`)
  }

  // Get user's username for profile link
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <ScoreReveal
      evaluation={evaluation}
      project={project}
      username={profile?.username || undefined}
    />
  )
}
