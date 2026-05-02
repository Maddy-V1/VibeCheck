import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { fetchFlaggedComments } from '@/lib/community/server'

export async function GET() {
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const comments = await fetchFlaggedComments()
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Admin flagged comments fetch error:', error)
    return NextResponse.json({ error: 'Failed to load flagged comments' }, { status: 500 })
  }
}
