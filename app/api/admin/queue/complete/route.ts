import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { project_id } = await request.json()

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Remove from queue (this will trigger position shift for remaining entries)
    const { error: queueError } = await serviceClient
      .from('queue')
      .delete()
      .eq('project_id', project_id)

    if (queueError) {
      console.error('Queue removal error:', queueError)
      return NextResponse.json(
        { error: 'Failed to remove from queue', details: queueError.message },
        { status: 500 }
      )
    }

    // Update project status to evaluated
    const { error: projectError } = await serviceClient
      .from('projects')
      .update({ status: 'evaluated' })
      .eq('id', project_id)

    if (projectError) {
      console.error('Project status update error:', projectError)
      return NextResponse.json(
        { error: 'Failed to update project status', details: projectError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in queue completion:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
