import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerComponentClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: authError?.message,
      })
    }

    // Try to fetch projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)

    if (projectsError) {
      return NextResponse.json({
        error: 'Failed to fetch projects',
        details: projectsError.message,
        code: projectsError.code,
        hint: projectsError.hint,
      })
    }

    // Try to fetch queue
    const { data: queue, error: queueError } = await supabase
      .from('queue')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      projects: projects || [],
      projectCount: projects?.length || 0,
      queue: queue || [],
      queueError: queueError?.message,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
