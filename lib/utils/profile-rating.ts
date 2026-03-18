import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export const TIER_WEIGHTS = {
  tier1: 1,
  tier2: 2,
  tier3: 3,
} as const

export const PROFILE_LEVELS = [
  { level: 'architect', min: 90, label: 'Architect' },
  { level: 'builder', min: 75, label: 'Builder' },
  { level: 'maker', min: 60, label: 'Maker' },
  { level: 'foundational', min: 40, label: 'Foundational' },
  { level: 'provisional', min: 0, label: 'Provisional' },
] as const

export type ProfileLevel = (typeof PROFILE_LEVELS)[number]['level']

interface RatingEvaluation {
  score_total: number
  tier_confirmed: 'tier1' | 'tier2' | 'tier3'
}

export function computeProfileRating(evaluations: RatingEvaluation[]) {
  if (evaluations.length < 3) {
    return null
  }

  let totalWeight = 0
  let weightedSum = 0

  for (const evaluation of evaluations) {
    const weight = TIER_WEIGHTS[evaluation.tier_confirmed]
    weightedSum += evaluation.score_total * weight
    totalWeight += weight
  }

  if (totalWeight === 0) {
    return null
  }

  return Number((weightedSum / totalWeight).toFixed(2))
}

export function computeProfileLevel(rating: number | null): ProfileLevel | null {
  if (rating === null) {
    return null
  }

  const match = PROFILE_LEVELS.find((item) => rating >= item.min)
  return match?.level ?? 'provisional'
}

export async function recalculateProfileRating(supabase: SupabaseClient<Database>, userId: string) {
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'evaluated')

  if (projectsError) {
    throw projectsError
  }

  const projectIds = (projects ?? []).map((project) => project.id)

  if (projectIds.length === 0) {
    const { error: resetError } = await supabase
      .from('profiles')
      .update({
        is_profile_public: false,
        profile_rating: null,
        profile_rating_at: null,
        certificate_level: null,
      })
      .eq('id', userId)

    if (resetError) {
      throw resetError
    }

    return {
      evaluatedCount: 0,
      rating: null,
      level: null,
      isPublic: false,
    }
  }

  const { data: evaluations, error: evaluationsError } = await supabase
    .from('evaluations')
    .select('score_total, tier_confirmed')
    .in('project_id', projectIds)

  if (evaluationsError) {
    throw evaluationsError
  }

  const normalized = (evaluations ?? []).map((item) => ({
    score_total: Number(item.score_total),
    tier_confirmed: item.tier_confirmed as 'tier1' | 'tier2' | 'tier3',
  }))

  const rating = computeProfileRating(normalized)
  const level = computeProfileLevel(rating)
  const isPublic = normalized.length >= 1

  const updatePayload = {
    is_profile_public: isPublic,
    profile_rating: rating,
    profile_rating_at: rating !== null ? new Date().toISOString() : null,
    certificate_level: level,
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (updateError) {
    throw updateError
  }

  return {
    evaluatedCount: normalized.length,
    rating,
    level,
    isPublic,
  }
}
