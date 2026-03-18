import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import {
  compareRankedProjects,
  getLeaderboardLimit,
  getLeaderboardWindow,
  type LeaderboardPeriodType,
} from '@/lib/utils/leaderboard'

function buildEmptyRankingData(periodType: LeaderboardPeriodType) {
  const window = getLeaderboardWindow(periodType)

  return {
    periodType,
    label: window.label,
    periodStart: window.periodStartIso,
    periodEnd: window.periodEndIso,
    maxSelections: getLeaderboardLimit(periodType),
    selected: [],
    selectedProjectIds: [],
    eligible: [],
    unavailable: true,
  }
}

function isRankingInfraMissing(error: unknown) {
  const message = JSON.stringify(error).toLowerCase()

  return (
    message.includes('project_rankings') ||
    message.includes('ranking_period') ||
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    message.includes('42p01') ||
    message.includes('pgrst')
  )
}

async function fetchRankingData(periodType: LeaderboardPeriodType) {
  const supabase = createServiceClient()
  const window = getLeaderboardWindow(periodType)

  const [
    { data: selectedRows, error: selectedError },
    { data: eligibleEvaluations, error: eligibleError },
  ] = await Promise.all([
    supabase
      .from('project_rankings')
      .select('project_id, evaluation_id, selected_at')
      .eq('period_type', periodType)
      .eq('period_start', window.periodStartIso),
    supabase
      .from('evaluations')
      .select('id, project_id, score_total, tier_confirmed, evaluated_at')
      .gte('evaluated_at', window.periodStartIso)
      .lt('evaluated_at', window.periodEndIso)
      .order('score_total', { ascending: false })
      .order('evaluated_at', { ascending: true }),
  ])

  if (selectedError && !isRankingInfraMissing(selectedError)) {
    throw selectedError
  }

  if (eligibleError) {
    throw eligibleError
  }

  const candidateProjectIds = Array.from(
    new Set([
      ...(selectedRows ?? []).map((row) => row.project_id),
      ...(eligibleEvaluations ?? []).map((row) => row.project_id),
    ])
  )

  const { data: projects, error: projectsError } = candidateProjectIds.length
    ? await supabase
        .from('projects')
        .select('id, user_id, title, description, tier, tech_stack, live_url, status, is_public')
        .in('id', candidateProjectIds)
    : { data: [], error: null }

  if (projectsError) {
    throw projectsError
  }

  const publicEvaluatedProjects = (projects ?? []).filter(
    (project) => project.status === 'evaluated' && project.is_public
  )

  const userIds = Array.from(new Set(publicEvaluatedProjects.map((project) => project.user_id)))

  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from('profiles').select('id, username, display_name').in('id', userIds)
    : { data: [], error: null }

  if (profilesError) {
    throw profilesError
  }

  const projectMap = new Map(publicEvaluatedProjects.map((project) => [project.id, project]))
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const evaluationMap = new Map(
    (eligibleEvaluations ?? []).map((evaluation) => [evaluation.id, evaluation])
  )

  const selected = (selectedRows ?? [])
    .map((row) => {
      const project = projectMap.get(row.project_id)
      const evaluation = evaluationMap.get(row.evaluation_id)
      const profile = project ? profileMap.get(project.user_id) : null

      if (!project || !evaluation || !profile?.username) {
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
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(compareRankedProjects)

  const eligible = (eligibleEvaluations ?? [])
    .map((evaluation) => {
      const project = projectMap.get(evaluation.project_id)
      const profile = project ? profileMap.get(project.user_id) : null

      if (!project || !profile?.username) {
        return null
      }

      return {
        projectId: project.id,
        title: project.title ?? 'Untitled Project',
        username: profile.username,
        displayName: profile.display_name ?? null,
        description: project.description ?? null,
        tier: project.tier ?? evaluation.tier_confirmed ?? 'tier1',
        confirmedTier: evaluation.tier_confirmed ?? project.tier ?? 'tier1',
        techStack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
        liveUrl: project.live_url ?? null,
        score: Number(evaluation.score_total ?? 0),
        evaluatedAt: evaluation.evaluated_at,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(compareRankedProjects)

  return {
    periodType,
    label: window.label,
    periodStart: window.periodStartIso,
    periodEnd: window.periodEndIso,
    maxSelections: getLeaderboardLimit(periodType),
    selected,
    selectedProjectIds: selected.map((item) => item.projectId),
    eligible,
    unavailable: Boolean(selectedError),
  }
}

export async function GET() {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [weekly, monthly] = await Promise.all([
      fetchRankingData('weekly'),
      fetchRankingData('monthly'),
    ])

    return NextResponse.json({
      weekly,
      monthly,
      rankingsUnavailable: weekly.unavailable || monthly.unavailable,
    })
  } catch (error) {
    console.error('Ranking fetch error:', error)

    if (isRankingInfraMissing(error)) {
      return NextResponse.json({
        weekly: buildEmptyRankingData('weekly'),
        monthly: buildEmptyRankingData('monthly'),
        rankingsUnavailable: true,
      })
    }

    return NextResponse.json({ error: 'Failed to fetch ranking data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const periodType = body.periodType as LeaderboardPeriodType
    const projectId = typeof body.projectId === 'string' ? body.projectId : ''
    const selected = Boolean(body.selected)

    if (!projectId || (periodType !== 'weekly' && periodType !== 'monthly')) {
      return NextResponse.json({ error: 'periodType and projectId are required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const window = getLeaderboardWindow(periodType)

    const [{ data: project, error: projectError }, { data: evaluation, error: evaluationError }] =
      await Promise.all([
        supabase.from('projects').select('id, status, is_public').eq('id', projectId).single(),
        supabase
          .from('evaluations')
          .select('id, project_id, evaluated_at')
          .eq('project_id', projectId)
          .gte('evaluated_at', window.periodStartIso)
          .lt('evaluated_at', window.periodEndIso)
          .single(),
      ])

    if (
      projectError ||
      evaluationError ||
      !project ||
      !evaluation ||
      project.status !== 'evaluated' ||
      !project.is_public
    ) {
      return NextResponse.json(
        { error: 'Project is not eligible for this ranking period' },
        { status: 400 }
      )
    }

    if (selected) {
      const { data: currentSelections, error: countError } = await supabase
        .from('project_rankings')
        .select('project_id')
        .eq('period_type', periodType)
        .eq('period_start', window.periodStartIso)

      if (countError) {
        throw countError
      }

      const alreadySelected = (currentSelections ?? []).some(
        (item) => item.project_id === projectId
      )

      if (!alreadySelected && (currentSelections?.length ?? 0) >= getLeaderboardLimit(periodType)) {
        return NextResponse.json(
          {
            error: `You can only select ${getLeaderboardLimit(periodType)} projects for ${periodType}.`,
          },
          { status: 400 }
        )
      }

      const { error: upsertError } = await supabase.from('project_rankings').upsert(
        {
          period_type: periodType,
          period_start: window.periodStartIso,
          period_end: window.periodEndIso,
          project_id: projectId,
          evaluation_id: evaluation.id,
          selected_by: evaluator.id,
          selected_at: new Date().toISOString(),
        },
        {
          onConflict: 'period_type,period_start,project_id',
        }
      )

      if (upsertError) {
        throw upsertError
      }
    } else {
      const { error: deleteError } = await supabase
        .from('project_rankings')
        .delete()
        .eq('period_type', periodType)
        .eq('period_start', window.periodStartIso)
        .eq('project_id', projectId)

      if (deleteError) {
        throw deleteError
      }
    }

    const payload =
      periodType === 'weekly'
        ? { weekly: await fetchRankingData('weekly') }
        : { monthly: await fetchRankingData('monthly') }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Ranking update error:', error)

    if (isRankingInfraMissing(error)) {
      return NextResponse.json(
        { error: 'Ranking setup is not ready yet. Run the latest Supabase migration first.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Failed to update rankings' }, { status: 500 })
  }
}
