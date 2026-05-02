import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildProjectReactionSummary, getCommunityViewer } from '@/lib/community/server'
import { isCommunityReactionType } from '@/lib/community/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const viewer = await getCommunityViewer()

  if (!viewer.userId) {
    return NextResponse.json({ error: 'Sign in required to react' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const reaction = typeof body?.reaction === 'string' ? body.reaction : null

  if (!isCommunityReactionType(reaction)) {
    return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
  }

  const { projectId } = await params
  const supabase = createServiceClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('is_public', true)
    .eq('status', 'evaluated')
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { error: reactionError } = await supabase.rpc('toggle_project_reaction', {
    p_project_id: projectId,
    p_user_id: viewer.userId,
    p_reaction: reaction,
  })

  if (reactionError) {
    console.error('Project reaction error:', reactionError)
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 })
  }

  const { data: reactions, error: fetchError } = await supabase
    .from('reactions')
    .select('project_id, reaction_type, user_id')
    .eq('project_id', projectId)
    .in('reaction_type', ['celebrate', 'fire', 'insightful'])

  if (fetchError) {
    console.error('Project reaction summary error:', fetchError)
    return NextResponse.json({ error: 'Failed to refresh reaction counts' }, { status: 500 })
  }

  const summary = buildProjectReactionSummary(reactions ?? [], viewer.userId).get(projectId)

  return NextResponse.json({
    reactionCounts: summary?.counts ?? { celebrate: 0, fire: 0, insightful: 0 },
    reactionCount: summary?.total ?? 0,
    userReaction: summary?.userReaction ?? null,
  })
}
