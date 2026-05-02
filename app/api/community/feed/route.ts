import { NextRequest, NextResponse } from 'next/server'
import {
  COMMUNITY_FEED_PAGE_SIZE,
  isCommunitySort,
  isCommunityTierFilter,
  parseCommunityMinScore,
  type CommunityFeedItem,
} from '@/lib/community/config'
import { buildProjectReactionSummary, getCommunityViewer } from '@/lib/community/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const cursor = Number.parseInt(url.searchParams.get('cursor') ?? '0', 10)
    const tierParam = url.searchParams.get('tier')
    const sortParam = url.searchParams.get('sort')
    const tier = isCommunityTierFilter(tierParam) ? tierParam : 'all'
    const sort = isCommunitySort(sortParam) ? sortParam : 'newest'
    const minScore = parseCommunityMinScore(url.searchParams.get('minScore'))
    const safeCursor = Number.isFinite(cursor) && cursor >= 0 ? cursor : 0

    const viewer = await getCommunityViewer()
    const supabase = createServiceClient()

    let query = supabase
      .from('evaluations')
      .select(
        `
        project_id,
        project:projects!evaluations_project_id_fkey (
          id,
          user_id,
          title,
          description,
          tech_stack,
          live_url,
          status,
          is_public
        ),
        score_total,
        tier_confirmed,
        reviewer_note,
        evaluated_at
      `,
        { count: 'exact' }
      )
      .eq('project.is_public', true)
      .eq('project.status', 'evaluated')
      .gte('score_total', minScore)
      .range(safeCursor, safeCursor + COMMUNITY_FEED_PAGE_SIZE - 1)

    if (tier !== 'all') {
      query = query.eq('tier_confirmed', tier)
    }

    query =
      sort === 'top-scored'
        ? query
            .order('score_total', { ascending: false })
            .order('evaluated_at', { ascending: false })
        : query.order('evaluated_at', { ascending: false })

    const { data: rows, error, count } = await query

    if (error) {
      console.error('Community feed fetch error:', error)
      return NextResponse.json(
        {
          error: 'Failed to load community feed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      )
    }

    const projectIds = (rows ?? []).map((row) => row.project_id)
    const userIds = Array.from(
      new Set(
        (rows ?? [])
          .map((row) => {
            const project = Array.isArray(row.project) ? row.project[0] : row.project
            return project?.user_id ?? null
          })
          .filter((value): value is string => Boolean(value))
      )
    )

    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds)
      : { data: [], error: null }

    if (profilesError) {
      console.error('Community feed profile fetch error:', profilesError)
      return NextResponse.json(
        {
          error: 'Failed to load community authors',
          details: process.env.NODE_ENV === 'development' ? profilesError.message : undefined,
        },
        { status: 500 }
      )
    }

    const { data: reactions, error: reactionsError } = projectIds.length
      ? await supabase
          .from('reactions')
          .select('project_id, reaction_type, user_id')
          .in('project_id', projectIds)
      : { data: [], error: null }

    if (reactionsError) {
      console.error('Community feed reaction fetch error:', reactionsError)
      return NextResponse.json(
        {
          error: 'Failed to load community reactions',
          details: process.env.NODE_ENV === 'development' ? reactionsError.message : undefined,
        },
        { status: 500 }
      )
    }

    const { data: comments, error: commentsError } = projectIds.length
      ? await supabase
          .from('comments')
          .select('project_id')
          .in('project_id', projectIds)
          .eq('status', 'visible')
      : { data: [], error: null }

    if (commentsError) {
      console.error('Community feed comment fetch error:', commentsError)
      return NextResponse.json(
        {
          error: 'Failed to load community comments',
          details: process.env.NODE_ENV === 'development' ? commentsError.message : undefined,
        },
        { status: 500 }
      )
    }

    const reactionSummary = buildProjectReactionSummary(reactions ?? [], viewer.userId)
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const commentCountMap = new Map<string, number>()

    for (const row of comments ?? []) {
      if (!row.project_id) continue
      commentCountMap.set(row.project_id, (commentCountMap.get(row.project_id) ?? 0) + 1)
    }

    const items: CommunityFeedItem[] = (rows ?? []).flatMap((row) => {
      const project = Array.isArray(row.project) ? row.project[0] : row.project

      if (!project) {
        return []
      }

      const summary = reactionSummary.get(project.id)
      const profile = profileMap.get(project.user_id)

      return [
        {
          projectId: project.id,
          title: project.title ?? 'Untitled Project',
          description: project.description ?? null,
          techStack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
          liveUrl: project.live_url ?? null,
          username: profile?.username ?? null,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          score: Number(row.score_total ?? 0),
          tier: row.tier_confirmed ?? 'tier1',
          evaluatedAt: row.evaluated_at,
          reviewerNote: row.reviewer_note ?? '',
          reactionCount: summary?.total ?? 0,
          commentCount: commentCountMap.get(project.id) ?? 0,
          reactionCounts: summary?.counts ?? { celebrate: 0, fire: 0, insightful: 0 },
          userReaction: summary?.userReaction ?? null,
        },
      ]
    })

    return NextResponse.json({
      items,
      nextCursor:
        count !== null && safeCursor + items.length < count ? safeCursor + items.length : null,
    })
  } catch (error) {
    console.error('Community feed route error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    )
  }
}
