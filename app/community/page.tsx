import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CommunityFeed } from '@/components/features/community/community-feed'
import { getCommunityViewer } from '@/lib/community/server'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/features/dashboard/sidebar'

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Browse recently evaluated VibeCheck projects, sorted by recency or score, and join the reaction loop.',
}

export default async function CommunityPage() {
  const viewer = await getCommunityViewer()
  const profile = await getCurrentProfile()
  let unreadCount = 0
  let isUnlocked = false

  if (profile) {
    const supabase = await createServerComponentClient()
    const [{ count }, { count: unread }] = await Promise.all([
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('status', 'evaluated'),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false),
    ])

    isUnlocked = (count ?? 0) > 0
    unreadCount = unread ?? 0
  }

  return (
    <main className="min-h-screen bg-black">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at top, rgba(99,102,241,0.16), transparent 36%), radial-gradient(circle at 80% 20%, rgba(56,189,248,0.12), transparent 24%)',
        }}
      />

      {profile ? (
        <Sidebar profile={profile} isUnlocked={isUnlocked} unreadCount={unreadCount} />
      ) : null}

      <div className={profile ? 'relative pb-20 lg:pb-0 lg:pl-64' : 'relative'}>
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
          <Link
            href={profile ? '/dashboard' : '/'}
            className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {profile ? 'Back to Dashboard' : 'Back to Home'}
          </Link>

          <section className="mb-8 rounded-[36px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-6 py-8 shadow-[0_28px_120px_rgba(0,0,0,0.45)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
              Community Feed
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Recently evaluated work, out in the open.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              Browse public project evaluations, sort by score or freshness, and open each badge to
              read the full review. Anyone can browse. Signed-in members can react, and members with
              an evaluated project can join the comments.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-zinc-300">
                Public browsing
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-zinc-300">
                Live score filters
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-zinc-300">
                Infinite scroll
              </span>
              {viewer.userId ? (
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-indigo-200">
                  Signed in as @{viewer.username || 'member'}
                </span>
              ) : null}
            </div>
          </section>

          <CommunityFeed viewer={viewer} />
        </div>
      </div>
    </main>
  )
}
