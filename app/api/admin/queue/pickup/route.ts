import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { project_id } = body

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    // Check if evaluator already has 3 active evaluations
    const { data: activeCount } = await supabase
      .from('queue')
      .select('id', { count: 'exact' })
      .eq('assigned_to', evaluator.id)

    if (activeCount && activeCount.length >= 3) {
      return NextResponse.json(
        { error: 'You can only have 3 active evaluations at once' },
        { status: 400 }
      )
    }

    // Assign project to evaluator
    const { data, error } = await supabase
      .from('queue')
      .update({
        assigned_to: evaluator.id,
        assigned_at: new Date().toISOString(),
      })
      .eq('project_id', project_id)
      .select()
      .single()

    if (error) {
      console.error('Queue assignment error:', error)
      return NextResponse.json({ error: 'Failed to assign project' }, { status: 500 })
    }

    // Update project status
    await supabase.from('projects').update({ status: 'evaluating' }).eq('id', project_id)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Pickup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
