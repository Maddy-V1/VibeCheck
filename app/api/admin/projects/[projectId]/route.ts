import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const profile = await getCurrentProfile()

  if (!profile?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Unwrap params promise (Next.js 15+)
  const { projectId } = await params

  // Use service client to bypass RLS (migration 10 was rolled back)
  const supabase = createServiceClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      profiles!projects_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq('id', projectId)
    .single()

  if (error || !project) {
    console.error('Project fetch error:', error)
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}
