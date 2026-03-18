import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns this project
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Get queue position
  const { data: queueEntry, error } = await supabase
    .from('queue')
    .select('position, estimated_days, plan')
    .eq('project_id', projectId)
    .single()

  if (error || !queueEntry) {
    return NextResponse.json({ error: 'Not in queue' }, { status: 404 })
  }

  return NextResponse.json(queueEntry)
}
