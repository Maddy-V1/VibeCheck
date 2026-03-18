import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import {
  computeProfileLevel,
  computeProfileRating,
  PROFILE_LEVELS,
  recalculateProfileRating,
} from '@/lib/utils/profile-rating'

type ProfileRatingSummary = {
  userId: string
  username: string
  displayName: string | null
  evaluatedCount: number
  currentRating: number | null
  currentLevel: string | null
  computedRating: number | null
  computedLevel: string | null
  isPublic: boolean
  needsSync: boolean
  lastEvaluatedAt: string | null
}

async function buildProfileRatingSummaries() {
  const supabase = createServiceClient()

  const [
    { data: profiles, error: profilesError },
    { data: projects, error: projectsError },
    { data: evaluationRows, error: evaluationError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, is_profile_public, profile_rating, certificate_level')
      .order('created_at', { ascending: false }),
    supabase.from('projects').select('id, user_id, status').eq('status', 'evaluated'),
    supabase
      .from('evaluations')
      .select('project_id, score_total, tier_confirmed, evaluated_at')
      .order('evaluated_at', { ascending: false }),
  ])

  if (profilesError) {
    throw profilesError
  }

  if (projectsError) {
    throw projectsError
  }

  if (evaluationError) {
    throw evaluationError
  }

  const projectMap = new Map((projects ?? []).map((project) => [project.id, project]))

  const grouped = new Map<
    string,
    Array<{
      score_total: number
      tier_confirmed: 'tier1' | 'tier2' | 'tier3'
      evaluated_at: string
    }>
  >()

  for (const row of evaluationRows ?? []) {
    const project = projectMap.get(row.project_id)
    const userId = project?.user_id

    if (!userId) {
      continue
    }

    const bucket = grouped.get(userId) ?? []
    bucket.push({
      score_total: Number(row.score_total),
      tier_confirmed: row.tier_confirmed as 'tier1' | 'tier2' | 'tier3',
      evaluated_at: row.evaluated_at,
    })
    grouped.set(userId, bucket)
  }

  const summaries: ProfileRatingSummary[] = (profiles ?? [])
    .map((profile) => {
      const evaluations = grouped.get(profile.id) ?? []
      const computedRating = computeProfileRating(
        evaluations.map((item) => ({
          score_total: item.score_total,
          tier_confirmed: item.tier_confirmed,
        }))
      )
      const computedLevel = computeProfileLevel(computedRating)
      const lastEvaluatedAt = evaluations[0]?.evaluated_at ?? null
      const currentRating = profile.profile_rating !== null ? Number(profile.profile_rating) : null

      return {
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        evaluatedCount: evaluations.length,
        currentRating,
        currentLevel: profile.certificate_level,
        computedRating,
        computedLevel,
        isPublic: profile.is_profile_public,
        needsSync:
          currentRating !== computedRating ||
          profile.certificate_level !== computedLevel ||
          (evaluations.length >= 1 && !profile.is_profile_public),
        lastEvaluatedAt,
      }
    })
    .filter((profile) => profile.evaluatedCount > 0)
    .sort((a, b) => {
      if (b.evaluatedCount !== a.evaluatedCount) {
        return b.evaluatedCount - a.evaluatedCount
      }

      if ((b.computedRating ?? -1) !== (a.computedRating ?? -1)) {
        return (b.computedRating ?? -1) - (a.computedRating ?? -1)
      }

      return a.username.localeCompare(b.username)
    })

  return {
    profiles: summaries,
    eligibleCount: summaries.filter((profile) => profile.evaluatedCount >= 3).length,
    syncedCount: summaries.filter((profile) => !profile.needsSync).length,
    levelLegend: PROFILE_LEVELS,
  }
}

export async function GET() {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const summary = await buildProfileRatingSummaries()
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Profile rating summary error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile rating data' }, { status: 500 })
  }
}

export async function POST() {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const supabase = createServiceClient()
    const { data: profiles, error } = await supabase.from('profiles').select('id')

    if (error) {
      throw error
    }

    for (const profile of profiles ?? []) {
      await recalculateProfileRating(supabase, profile.id)
    }

    const summary = await buildProfileRatingSummaries()
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Profile rating sync error:', error)
    return NextResponse.json({ error: 'Failed to sync profile ratings' }, { status: 500 })
  }
}
