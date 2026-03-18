export type LeaderboardPeriodType = 'weekly' | 'monthly'

export interface RankedProject {
  projectId: string
  title: string
  username: string
  displayName: string | null
  description: string | null
  tier: string
  confirmedTier: string
  techStack: string[]
  liveUrl: string | null
  score: number
  evaluatedAt: string
}

export const LEADERBOARD_LIMITS: Record<LeaderboardPeriodType, number> = {
  weekly: 10,
  monthly: 50,
}

export function getLeaderboardLimit(periodType: LeaderboardPeriodType) {
  return LEADERBOARD_LIMITS[periodType]
}

export function getLeaderboardWindow(periodType: LeaderboardPeriodType, now = new Date()) {
  if (periodType === 'monthly') {
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))

    return {
      periodStart,
      periodEnd,
      periodStartIso: periodStart.toISOString(),
      periodEndIso: periodEnd.toISOString(),
      label: 'This Month',
    }
  }

  const currentDay = now.getUTCDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset, 0, 0, 0, 0)
  )
  const periodEnd = new Date(periodStart)
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 7)

  return {
    periodStart,
    periodEnd,
    periodStartIso: periodStart.toISOString(),
    periodEndIso: periodEnd.toISOString(),
    label: 'This Week',
  }
}

export function compareRankedProjects(a: RankedProject, b: RankedProject) {
  if (b.score !== a.score) {
    return b.score - a.score
  }

  const timeDelta = new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime()

  if (timeDelta !== 0) {
    return timeDelta
  }

  return a.projectId.localeCompare(b.projectId)
}

export function normalizePublishedRankingRow(row: any): RankedProject | null {
  const project = Array.isArray(row?.projects) ? row.projects[0] : row?.projects
  const evaluation = Array.isArray(row?.evaluations) ? row.evaluations[0] : row?.evaluations
  const profile = Array.isArray(project?.profiles) ? project.profiles[0] : project?.profiles

  if (!project?.id || !evaluation?.evaluated_at || !profile?.username) {
    return null
  }

  return {
    projectId: project.id,
    title: project.title ?? 'Untitled Project',
    username: profile.username,
    displayName: profile.display_name ?? null,
    description: project.description ?? null,
    tier: project.tier ?? 'tier1',
    confirmedTier: evaluation.tier_confirmed ?? project.tier ?? 'tier1',
    techStack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
    liveUrl: project.live_url ?? null,
    score: Number(evaluation.score_total ?? 0),
    evaluatedAt: evaluation.evaluated_at,
  }
}

export function normalizeEligibleEvaluationRow(row: any): RankedProject | null {
  const project = Array.isArray(row?.projects) ? row.projects[0] : row?.projects
  const profile = Array.isArray(project?.profiles) ? project.profiles[0] : project?.profiles

  if (!project?.id || !row?.evaluated_at || !profile?.username) {
    return null
  }

  return {
    projectId: project.id,
    title: project.title ?? 'Untitled Project',
    username: profile.username,
    displayName: profile.display_name ?? null,
    description: project.description ?? null,
    tier: project.tier ?? row.tier_confirmed ?? 'tier1',
    confirmedTier: row.tier_confirmed ?? project.tier ?? 'tier1',
    techStack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
    liveUrl: project.live_url ?? null,
    score: Number(row.score_total ?? 0),
    evaluatedAt: row.evaluated_at,
  }
}
