import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { NotificationsList } from '@/components/features/dashboard/notifications-list'

export const metadata = {
  title: 'Notifications',
}

export default async function NotificationsPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/sign-in')
  }

  if (!profile.onboarding_done) {
    redirect('/dashboard/onboarding')
  }

  const supabase = await createServerComponentClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Notifications</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Stay updated on your project evaluations and community activity
        </p>
      </div>

      <NotificationsList notifications={notifications || []} />
    </div>
  )
}
