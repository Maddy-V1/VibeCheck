import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchProjectComments, getCommunityViewer } from '@/lib/community/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const viewer = await getCommunityViewer()
    const supabase = createServiceClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, is_public, status')
      .eq('id', projectId)
      .single()

    const canAccessProject =
      !projectError &&
      project &&
      project.status === 'evaluated' &&
      (project.is_public || project.user_id === viewer.userId)

    if (!canAccessProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const comments = await fetchProjectComments(projectId, viewer.userId)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Project comments fetch error:', error)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const viewer = await getCommunityViewer()

  if (!viewer.userId) {
    return NextResponse.json({ error: 'Sign in required to comment' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const commentBody = typeof body?.body === 'string' ? body.body.trim() : ''
  const parentCommentId = typeof body?.parentCommentId === 'string' ? body.parentCommentId : null

  if (commentBody.length < 1 || commentBody.length > 2000) {
    return NextResponse.json(
      { error: 'Comment must be between 1 and 2000 characters' },
      { status: 400 }
    )
  }

  const { projectId } = await params
  const supabase = createServiceClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, is_public, status')
    .eq('id', projectId)
    .single()

  const canAccessProject =
    !projectError &&
    project &&
    project.status === 'evaluated' &&
    (project.is_public || project.user_id === viewer.userId)

  if (!canAccessProject) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const isProjectOwner = project.user_id === viewer.userId

  if (!viewer.canComment && !isProjectOwner) {
    return NextResponse.json(
      {
        error:
          viewer.evaluatedProjectCount === 0
            ? 'Submit a project to join the conversation'
            : 'Your community access is currently limited',
      },
      { status: 403 }
    )
  }

  if (parentCommentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from('comments')
      .select('id, parent_comment_id, project_id')
      .eq('id', parentCommentId)
      .single()

    if (parentError || !parentComment || parentComment.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Parent comment not found on this project' },
        { status: 400 }
      )
    }

    if (parentComment.parent_comment_id) {
      return NextResponse.json(
        { error: 'Cannot reply to a reply. Only one level of nesting allowed.' },
        { status: 400 }
      )
    }
  }

  const { error: commentError } = await supabase.from('comments').insert({
    project_id: projectId,
    user_id: viewer.userId,
    body: commentBody,
    status: 'visible',
    parent_comment_id: parentCommentId,
  })

  if (commentError) {
    console.error('Project comment create error:', commentError)
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development' ? commentError.message : 'Failed to add comment',
      },
      { status: 400 }
    )
  }

  const comments = await fetchProjectComments(projectId, viewer.userId)

  return NextResponse.json({ comments })
}
