import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCommunityViewer } from '@/lib/community/server'
import { isCommunityFlagReason } from '@/lib/community/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const viewer = await getCommunityViewer()

  if (!viewer.userId) {
    return NextResponse.json({ error: 'Sign in required to report content' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const reason = typeof body?.reason === 'string' ? body.reason : null
  const details =
    typeof body?.details === 'string' && body.details.trim() ? body.details.trim() : null

  if (!isCommunityFlagReason(reason)) {
    return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 })
  }

  const { commentId } = await params
  const supabase = createServiceClient()

  const { error: flagError } = await supabase.rpc('report_comment_for_moderation', {
    p_comment_id: commentId,
    p_reporter_id: viewer.userId,
    p_reason: reason,
    p_details: details,
  })

  if (flagError) {
    console.error('Flag comment error:', flagError)

    if (flagError.message === 'Comment not found') {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (
      flagError.message === 'You cannot report your own comment' ||
      flagError.message === 'Invalid moderation reason'
    ) {
      return NextResponse.json({ error: flagError.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
