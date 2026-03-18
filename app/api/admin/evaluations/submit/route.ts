import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { evaluationSchema } from '@/lib/validations/evaluation'
import { recalculateProfileRating } from '@/lib/utils/profile-rating'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const evaluator = await getCurrentProfile()

  if (!evaluator?.is_evaluator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = evaluationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Calculate total
    const score_total =
      data.score_functionality +
      data.score_ux +
      data.score_complexity +
      data.score_deployment +
      data.score_code_quality +
      data.score_documentation +
      data.score_originality

    // Insert evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        project_id: data.project_id,
        evaluator_id: evaluator.id,
        tier_confirmed: data.tier_confirmed,
        score_total,
        score_functionality: data.score_functionality,
        score_ux: data.score_ux,
        score_complexity: data.score_complexity,
        score_deployment: data.score_deployment,
        score_code_quality: data.score_code_quality,
        score_documentation: data.score_documentation,
        score_originality: data.score_originality,
        reviewer_note: data.reviewer_note,
        internal_notes: data.internal_notes || null,
      })
      .select()
      .single()

    if (evalError) {
      console.error('Evaluation insert error:', evalError)
      return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 })
    }

    // Update project with confirmed tier
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        status: 'evaluated',
        is_public: true,
        evaluation_id: evaluation.id,
        tier: data.tier_confirmed, // Update tier to evaluator's confirmed tier
      })
      .eq('id', data.project_id)

    if (projectError) {
      console.error('Project update error:', projectError)
    }

    // Get project owner
    const { data: project } = await supabase
      .from('projects')
      .select('user_id, title')
      .eq('id', data.project_id)
      .single()

    if (project) {
      // Remove from queue
      await supabase.from('queue').delete().eq('project_id', data.project_id)

      try {
        await recalculateProfileRating(supabase, project.user_id)
      } catch (ratingError) {
        console.error('Profile rating recalculation failed:', ratingError)
      }

      // Create notification
      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'evaluation_complete',
        title: 'Your project has been evaluated!',
        body: `${project.title} scored ${score_total}/100. See your full results.`,
        link: `/dashboard/projects/${data.project_id}`,
      })

      // Trigger certificate generation with better error handling
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      try {
        const certResponse = await fetch(`${appUrl}/api/certificates/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: data.project_id,
            evaluation_id: evaluation.id,
            user_id: project.user_id,
          }),
        })

        if (!certResponse.ok) {
          const errorData = await certResponse.json()
          console.error('Certificate generation failed:', errorData)
        } else {
          const certData = await certResponse.json()
          console.log('Certificate generated successfully:', certData)
        }
      } catch (err) {
        console.error('Certificate generation request failed:', err)
      }

      // TODO: Send evaluation complete email via Resend
      // See 12-EMAIL-SYSTEM.md
    }

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('Evaluation submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
