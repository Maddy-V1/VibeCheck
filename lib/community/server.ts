import { createServerComponentClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type {
  CommunityReactionType,
  CommunityViewer,
  FlaggedCommentItem,
  ProjectComment,
} from '@/lib/community/config'

export async function getCommunityViewer(): Promise<CommunityViewer> {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      userId: null,
      username: null,
      communityStatus: null,
      evaluatedProjectCount: 0,
      canReact: false,
      canComment: false,
      isEvaluator: false,
    }
  }

  const serviceSupabase = createServiceClient()

  const [{ data: profile }, { count }] = await Promise.all([
    serviceSupabase
      .from('profiles')
      .select('username, community_status, is_evaluator')
      .eq('id', user.id)
      .single(),
    serviceSupabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'evaluated'),
  ])

  const evaluatedProjectCount = count ?? 0
  const communityStatus = profile?.community_status ?? 'active'
  const canComment = Boolean(user.id) && evaluatedProjectCount > 0 && communityStatus === 'active'

  return {
    userId: user.id,
    username: profile?.username ?? null,
    communityStatus,
    evaluatedProjectCount,
    canReact: true,
    canComment,
    isEvaluator: Boolean(profile?.is_evaluator),
  }
}

export function buildProjectReactionSummary(
  rows: Array<{ project_id: string | null; reaction_type: string | null; user_id: string }> | null,
  viewerId: string | null
) {
  const summary = new Map<
    string,
    {
      counts: Record<CommunityReactionType, number>
      userReaction: CommunityReactionType | null
      total: number
    }
  >()

  for (const row of rows ?? []) {
    if (!row.project_id) continue
    if (
      row.reaction_type !== 'celebrate' &&
      row.reaction_type !== 'fire' &&
      row.reaction_type !== 'insightful'
    ) {
      continue
    }

    const current = summary.get(row.project_id) ?? {
      counts: {
        celebrate: 0,
        fire: 0,
        insightful: 0,
      },
      userReaction: null,
      total: 0,
    }

    current.counts[row.reaction_type] += 1
    current.total += 1

    if (viewerId && row.user_id === viewerId) {
      current.userReaction = row.reaction_type
    }

    summary.set(row.project_id, current)
  }

  return summary
}

export async function fetchProjectComments(projectId: string, viewerId: string | null) {
  const supabase = createServiceClient()

  const { data: commentRows, error } = await supabase
    .from('comments')
    .select(
      `
      id,
      project_id,
      user_id,
      body,
      status,
      is_edited,
      reply_count,
      parent_comment_id,
      created_at,
      profiles!comments_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq('project_id', projectId)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const commentIds = (commentRows ?? []).map((comment) => comment.id)

  const { data: viewerFlags } =
    viewerId && commentIds.length > 0
      ? await supabase
          .from('comment_flags')
          .select('comment_id')
          .eq('user_id', viewerId)
          .in('comment_id', commentIds)
      : { data: [] as Array<{ comment_id: string }> }

  const flaggedIds = new Set((viewerFlags ?? []).map((flag) => flag.comment_id))
  const repliesByParent = new Map<string, ProjectComment[]>()
  const topLevel: ProjectComment[] = []

  for (const row of commentRows ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const comment: ProjectComment = {
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      isEdited: row.is_edited,
      replyCount: row.reply_count ?? 0,
      parentCommentId: row.parent_comment_id,
      status: row.status,
      username: profile?.username ?? null,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      userId: row.user_id,
      flaggedByViewer: flaggedIds.has(row.id),
      replies: [],
    }

    if (row.parent_comment_id) {
      const existingReplies = repliesByParent.get(row.parent_comment_id) ?? []
      existingReplies.push(comment)
      repliesByParent.set(row.parent_comment_id, existingReplies)
    } else {
      topLevel.push(comment)
    }
  }

  return topLevel.map((comment) => ({
    ...comment,
    replies: repliesByParent.get(comment.id) ?? [],
  }))
}

export async function fetchFlaggedComments(): Promise<FlaggedCommentItem[]> {
  const supabase = createServiceClient()

  const { data: flaggedComments, error } = await supabase
    .from('comments')
    .select(
      `
      id,
      body,
      status,
      created_at,
      project_id,
      user_id,
      profiles!comments_user_id_fkey (
        username,
        display_name
      ),
      projects!comments_project_id_fkey (
        title,
        profiles!projects_user_id_fkey (
          username
        )
      )
    `
    )
    .eq('status', 'flagged')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const ids = (flaggedComments ?? []).map((comment) => comment.id)

  const { data: flagCounts, error: flagCountError } = ids.length
    ? await supabase.from('comment_flags').select('comment_id').in('comment_id', ids)
    : { data: [] as Array<{ comment_id: string }>, error: null }

  if (flagCountError) {
    throw flagCountError
  }

  const flagCountMap = new Map<string, number>()

  for (const row of flagCounts ?? []) {
    flagCountMap.set(row.comment_id, (flagCountMap.get(row.comment_id) ?? 0) + 1)
  }

  return (flaggedComments ?? []).map((comment) => {
    const author = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
    const project = Array.isArray(comment.projects) ? comment.projects[0] : comment.projects
    const ownerProfile = Array.isArray(project?.profiles) ? project?.profiles[0] : project?.profiles

    return {
      id: comment.id,
      body: comment.body,
      status: comment.status,
      createdAt: comment.created_at,
      flagCount: flagCountMap.get(comment.id) ?? 0,
      projectId: comment.project_id ?? '',
      projectTitle: project?.title ?? null,
      projectOwnerUsername: ownerProfile?.username ?? null,
      authorUsername: author?.username ?? null,
      authorDisplayName: author?.display_name ?? null,
    }
  })
}
