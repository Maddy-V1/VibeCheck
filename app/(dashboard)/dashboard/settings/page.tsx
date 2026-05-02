import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/auth-helpers'
import { createServiceClient } from '@/lib/supabase/service'
import { SettingsProfile } from '@/components/features/dashboard/settings/settings-profile'
import { SettingsAccount } from '@/components/features/dashboard/settings/settings-account'
import { SettingsDangerZone } from '@/components/features/dashboard/settings/settings-danger-zone'
import { SettingsActivity } from '@/components/features/dashboard/settings/settings-activity'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/sign-in')
  }

  if (!profile.onboarding_done) {
    redirect('/dashboard/onboarding')
  }

  // Fetch user's reactions with project titles
  const serviceSupabase = createServiceClient()

  const [{ data: reactionsData }, { data: commentsData }] = await Promise.all([
    serviceSupabase
      .from('reactions')
      .select(
        `
        id,
        reaction_type,
        created_at,
        project_id,
        projects!reactions_project_id_fkey (
          title
        )
      `
      )
      .eq('user_id', profile.id)
      .not('project_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50),
    serviceSupabase
      .from('comments')
      .select(
        `
        id,
        body,
        is_edited,
        created_at,
        project_id,
        projects!comments_project_id_fkey (
          title
        )
      `
      )
      .eq('user_id', profile.id)
      .eq('status', 'visible')
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const reactions = (reactionsData ?? [])
    .filter((r) => r.project_id !== null)
    .map((r) => {
      const project = Array.isArray(r.projects) ? r.projects[0] : r.projects
      return {
        id: r.id,
        reactionType: r.reaction_type,
        createdAt: r.created_at,
        projectId: r.project_id!,
        projectTitle: project?.title ?? 'Unknown project',
      }
    })

  const comments = (commentsData ?? [])
    .filter((c) => c.project_id !== null)
    .map((c) => {
      const project = Array.isArray(c.projects) ? c.projects[0] : c.projects
      return {
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        isEdited: c.is_edited,
        projectId: c.project_id!,
        projectTitle: project?.title ?? 'Unknown project',
      }
    })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Manage your account, profile, and preferences
        </p>
      </div>

      <SettingsProfile profile={profile} />
      <SettingsAccount profile={profile} userEmail={user.email || null} />
      <SettingsActivity reactions={reactions} comments={comments} />
      <SettingsDangerZone profile={profile} />
    </div>
  )
}
