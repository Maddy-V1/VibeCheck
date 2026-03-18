import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const supabase = createServiceClient()

    // Fetch queue with related data using service role (bypasses RLS)
    const { data: queueItems, error } = await supabase
      .from('queue')
      .select(
        `
        *,
        projects!inner (
          id,
          title,
          tier,
          live_url,
          github_url,
          demo_video_url,
          tech_stack,
          description,
          created_at
        ),
        profiles!queue_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .order('position', { ascending: true })

    if (error) {
      console.error('Queue fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch queue', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ queue: queueItems || [], evaluator })
  } catch (error) {
    console.error('Queue list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
