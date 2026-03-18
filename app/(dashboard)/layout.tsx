import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/features/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/sign-in')
  }

  // Check if profile is unlocked (has evaluated projects)
  const supabase = await createServerComponentClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, status')
    .eq('user_id', profile.id)
    .eq('status', 'evaluated')
    .limit(1)

  const isUnlocked = (projects?.length ?? 0) > 0

  // Get unread notification count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)

  return (
    <div className="min-h-screen bg-black">
      <Sidebar profile={profile} isUnlocked={isUnlocked} unreadCount={unreadCount || 0} />

      <main className="pb-20 lg:pb-0 lg:pl-64">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  )
}
