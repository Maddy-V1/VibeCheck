import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { project_id, evaluator_id } = await request.json()

    if (!project_id || !evaluator_id) {
      return NextResponse.json(
        { error: 'project_id and evaluator_id are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Update queue entry to assign evaluator
    const { error: queueError } = await serviceClient
      .from('queue')
      .update({
        assigned_to: evaluator_id,
        assigned_at: new Date().toISOString(),
      })
      .eq('project_id', project_id)

    if (queueError) {
      console.error('Queue assignment error:', queueError)
      return NextResponse.json(
        { error: 'Failed to assign project', details: queueError.message },
        { status: 500 }
      )
    }

    // Update project status to evaluating
    const { error: projectError } = await serviceClient
      .from('projects')
      .update({ status: 'evaluating' })
      .eq('id', project_id)

    if (projectError) {
      console.error('Project status update error:', projectError)
      return NextResponse.json(
        { error: 'Failed to update project status', details: projectError.message },
        { status: 500 }
      )
    }

    // Create notification for project owner
    const { data: project } = await serviceClient
      .from('projects')
      .select('user_id, title')
      .eq('id', project_id)
      .single()

    if (project) {
      await serviceClient.from('notifications').insert({
        user_id: project.user_id,
        type: 'evaluation_started',
        title: 'Evaluation in progress',
        body: `${project.title} is now being evaluated.`,
        link: `/dashboard/projects/${project_id}`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in queue assignment:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
