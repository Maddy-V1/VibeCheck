import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const { project_id, evaluation_id, user_id } = await request.json()

    if (!project_id || !evaluation_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch all required data
    const [{ data: project, error: projectError }, { data: evaluation, error: evalError }] =
      await Promise.all([
        supabase.from('projects').select('*').eq('id', project_id).single(),
        supabase.from('evaluations').select('*').eq('id', evaluation_id).single(),
      ])

    if (projectError || evalError || !project || !evaluation) {
      console.error('Data fetch error:', { projectError, evalError })
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Generate verification ID
    const verification_id = crypto.randomUUID()

    // For now, create badge record without actual image generation
    // Image generation with Satori/Sharp can be added later
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .upsert(
        {
          user_id,
          project_id,
          type: 'project_badge',
          tier: evaluation.tier_confirmed,
          score: evaluation.score_total,
          certificate_url: null, // Will be generated later
          shareable_link: `/badge/${project_id}`,
          verification_id,
          is_valid: true,
        },
        {
          onConflict: 'user_id,project_id',
        }
      )
      .select()
      .single()

    if (badgeError) {
      console.error('Badge record error:', badgeError)
      return NextResponse.json(
        { error: 'Failed to create badge', details: badgeError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      badge_id: badge?.id,
      verification_id,
      message: 'Badge record created successfully',
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
