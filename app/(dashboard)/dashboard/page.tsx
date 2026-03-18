import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { LockedDashboard } from '@/components/features/dashboard/locked-dashboard'
import { UnlockedDashboard } from '@/components/features/dashboard/unlocked-dashboard'
import {
  compareRankedProjects,
  getLeaderboardWindow,
  normalizePublishedRankingRow,
} from '@/lib/utils/leaderboard'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/sign-in')
  }

  if (!profile.onboarding_done) {
    redirect('/dashboard/onboarding')
  }

  const supabase = await createServerComponentClient()

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Fetch queue data separately for in-queue projects
  const inQueueProjectIds =
    projects
      ?.filter((p) => p.status === 'in_queue' || p.status === 'evaluating')
      .map((p) => p.id) || []

  let queueData: any[] = []
  if (inQueueProjectIds.length > 0) {
    const { data } = await supabase.from('queue').select('*').in('project_id', inQueueProjectIds)
    queueData = data || []
  }

  // Fetch evaluations data separately for evaluated projects
  const evaluatedProjectIds =
    projects?.filter((p) => p.status === 'evaluated').map((p) => p.id) || []

  let evaluationsData: any[] = []
  if (evaluatedProjectIds.length > 0) {
    const { data } = await supabase
      .from('evaluations')
      .select('*')
      .in('project_id', evaluatedProjectIds)
    evaluationsData = data || []
  }

  // Attach queue data and evaluations to projects
  const projectsWithQueue =
    projects?.map((project) => {
      const queue = queueData.find((q) => q.project_id === project.id)
      const evaluation = evaluationsData.find((e) => e.project_id === project.id)
      return {
        ...project,
        queue: queue ? [queue] : [],
        evaluations: evaluation ? [evaluation] : [],
      }
    }) || []

  // Fetch recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const weeklyWindow = getLeaderboardWindow('weekly')
  const monthlyWindow = getLeaderboardWindow('monthly')

  const [{ data: weeklyRows }, { data: monthlyRows }] = await Promise.all([
    supabase
      .from('project_rankings')
      .select(
        `
        project_id,
        selected_at,
        projects!project_rankings_project_id_fkey (
          id,
          title,
          description,
          tier,
          tech_stack,
          live_url,
          profiles!projects_user_id_fkey (
            username,
            display_name
          )
        ),
        evaluations!project_rankings_evaluation_id_fkey (
          score_total,
          tier_confirmed,
          evaluated_at
        )
      `
      )
      .eq('period_type', 'weekly')
      .eq('period_start', weeklyWindow.periodStartIso),
    supabase
      .from('project_rankings')
      .select(
        `
        project_id,
        selected_at,
        projects!project_rankings_project_id_fkey (
          id,
          title,
          description,
          tier,
          tech_stack,
          live_url,
          profiles!projects_user_id_fkey (
            username,
            display_name
          )
        ),
        evaluations!project_rankings_evaluation_id_fkey (
          score_total,
          tier_confirmed,
          evaluated_at
        )
      `
      )
      .eq('period_type', 'monthly')
      .eq('period_start', monthlyWindow.periodStartIso),
  ])

  const leaderboards = {
    weekly: (weeklyRows ?? [])
      .map(normalizePublishedRankingRow)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(compareRankedProjects),
    monthly: (monthlyRows ?? [])
      .map(normalizePublishedRankingRow)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(compareRankedProjects),
  }

  // Determine if profile is unlocked
  const isUnlocked = projectsWithQueue?.some((p) => p.status === 'evaluated') ?? false

  // Check if user has submitted projects
  const hasSubmittedProject =
    projectsWithQueue?.some(
      (p) => p.status === 'submitted' || p.status === 'in_queue' || p.status === 'evaluating'
    ) ?? false

  // Get queue info for first submitted project
  const queueProject = projectsWithQueue?.find(
    (p) => p.status === 'in_queue' || p.status === 'submitted'
  )
  const queueInfo = queueProject?.queue?.[0]

  return isUnlocked ? (
    <UnlockedDashboard
      profile={profile}
      projects={projectsWithQueue || []}
      notifications={notifications || []}
      leaderboards={leaderboards}
    />
  ) : (
    <LockedDashboard
      profile={profile}
      hasSubmittedProject={hasSubmittedProject}
      queuePosition={queueInfo?.position}
      estimatedDays={queueInfo?.estimated_days}
      leaderboards={leaderboards}
    />
  )
}
