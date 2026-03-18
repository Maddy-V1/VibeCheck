import { createServerComponentClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { projectSubmissionSchema } from '@/lib/validations/project'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerComponentClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = projectSubmissionSchema.safeParse(body)

    if (!parsed.success) {
      console.error('Validation error:', parsed.error)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const {
      confirmed_live,
      confirmed_own,
      confirmed_guidelines,
      github_url,
      demo_video_url,
      ...projectData
    } = parsed.data

    // Generate unique slug
    const slug = await generateUniqueSlug(projectData.title, supabase)

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        github_url: github_url || null,
        demo_video_url: demo_video_url || null,
        slug,
        user_id: user.id,
        status: 'in_queue',
        queue_entered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return NextResponse.json(
        { error: 'Failed to create project', details: projectError.message },
        { status: 500 }
      )
    }

    // Get user's plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    // Use service client for queue operations (bypasses RLS)
    const serviceClient = createServiceClient()

    // Add to queue (position will be auto-assigned by trigger)
    const { data: queueEntry, error: queueError } = await serviceClient
      .from('queue')
      .insert({
        project_id: project.id,
        user_id: user.id,
        plan: profile?.plan || 'free',
        position: 0, // Assigned by trigger, added here to satisfy TS
      })
      .select('position')
      .single()

    if (queueError) {
      console.error('Queue insertion error:', queueError)
      // Rollback project if queue fails
      await supabase.from('projects').delete().eq('id', project.id)
      return NextResponse.json(
        { error: 'Failed to add to queue', details: queueError.message },
        { status: 500 }
      )
    }

    // Calculate estimated days (30 evaluations per day)
    const EVALUATIONS_PER_DAY = 30
    const estimatedDays = Math.ceil((queueEntry?.position || 1) / EVALUATIONS_PER_DAY)

    // Update queue entry with estimated days
    await serviceClient
      .from('queue')
      .update({ estimated_days: estimatedDays })
      .eq('project_id', project.id)

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'project_submitted',
      title: 'Project submitted!',
      body: `${project.title} is now #${queueEntry?.position} in the evaluation queue.`,
      link: `/dashboard/projects/${project.id}`,
    })

    return NextResponse.json({
      project,
      queue_position: queueEntry?.position || 1,
      estimated_days: estimatedDays,
    })
  } catch (error) {
    console.error('Unexpected error in project submission:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
