import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Debug route to manually generate badge for a project
// Usage: POST /api/debug/generate-badge with { project_id: "uuid" }

export async function POST(request: NextRequest) {
  try {
    const { project_id } = await request.json()

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get project and evaluation
    const { data: project } = await supabase
      .from('projects')
      .select('*, evaluations(*)')
      .eq('id', project_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const evaluation = (project.evaluations as unknown as any[])?.[0]

    if (!evaluation) {
      return NextResponse.json({ error: 'No evaluation found for this project' }, { status: 404 })
    }

    // Call certificate generation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${appUrl}/api/certificates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: project.id,
        evaluation_id: evaluation.id,
        user_id: project.user_id,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: 'Badge generation failed', details: data }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Badge generated successfully',
      data,
      badge_url: `/badge/${project_id}`,
    })
  } catch (error) {
    console.error('Debug badge generation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    )
  }
}
