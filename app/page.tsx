import type { Metadata } from 'next'
import Link from 'next/link'
import { RankedProjectList } from '@/components/features/leaderboard/ranked-project-list'
import { createServerComponentClient } from '@/lib/supabase/server'
import {
  compareRankedProjects,
  getLeaderboardWindow,
  normalizePublishedRankingRow,
} from '@/lib/utils/leaderboard'

export const metadata: Metadata = {
  title: 'VibeCheck — Verified Credentials for AI-Native Developers',
  description: 'Expert evaluation and verifiable credentials for developers building with AI.',
}

const FEATURES = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Expert Review',
    desc: 'Real engineers evaluate your AI-built projects with structured rubrics.',
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-4 0v2M8 11h8M8 15h5" />
      </svg>
    ),
    title: 'Verifiable Badges',
    desc: 'Earn on-chain credentials that prove your skills with zero ambiguity.',
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    title: 'Public Portfolio',
    desc: 'A shareable profile employers can inspect in under 60 seconds.',
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Tier Progression',
    desc: 'Level up from Provisional → Maker → Builder → Architect.',
  },
]

const TIERS = [
  { name: 'Provisional', label: 'Tier 1', color: '#71717A' },
  { name: 'Maker', label: 'Tier 2', color: '#06B6D4' },
  { name: 'Builder', label: 'Tier 3', color: '#8B5CF6' },
  { name: 'Architect', label: 'Tier 4', color: '#F59E0B' },
]

async function getPublishedRankings() {
  const supabase = await createServerComponentClient()
  const weeklyWindow = getLeaderboardWindow('weekly')
  const monthlyWindow = getLeaderboardWindow('monthly')

  const [{ data: weeklyRows }, { data: monthlyRows }] = await Promise.all([
    supabase
      .from('project_rankings')
      .select(
        `
        project_id,
        selected_at,
        projects!project_rankings_project_id_fkey (
          id,
          title,
          description,
          tier,
          tech_stack,
          live_url,
          profiles!projects_user_id_fkey (
            username,
            display_name
          )
        ),
        evaluations!project_rankings_evaluation_id_fkey (
          score_total,
          tier_confirmed,
          evaluated_at
        )
      `
      )
      .eq('period_type', 'weekly')
      .eq('period_start', weeklyWindow.periodStartIso),
    supabase
      .from('project_rankings')
      .select(
        `
        project_id,
        selected_at,
        projects!project_rankings_project_id_fkey (
          id,
          title,
          description,
          tier,
          tech_stack,
          live_url,
          profiles!projects_user_id_fkey (
            username,
            display_name
          )
        ),
        evaluations!project_rankings_evaluation_id_fkey (
          score_total,
          tier_confirmed,
          evaluated_at
        )
      `
      )
      .eq('period_type', 'monthly')
      .eq('period_start', monthlyWindow.periodStartIso),
  ])

  return {
    weekly: (weeklyRows ?? [])
      .map(normalizePublishedRankingRow)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(compareRankedProjects),
    monthly: (monthlyRows ?? [])
      .map(normalizePublishedRankingRow)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(compareRankedProjects),
  }
}

export default async function HomePage() {
  const leaderboards = await getPublishedRankings()

  return (
    <main className="relative min-h-dvh bg-black text-white">
      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 60%)',
        }}
      />

      {/* ── Nav ── */}
      <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.07] ring-1 ring-white/[0.1]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#818CF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">VibeCheck</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/sign-in"
            className="hidden h-9 items-center rounded-lg px-4 text-[13px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.97]"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-20 text-center md:pt-28">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Now in beta — apply for early access
          </span>
        </div>

        <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-[4.25rem]">
          Your vibe code <br className="hidden sm:block" />
          needs a <span className="gradient-text">proof of work.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-md text-[15px] leading-relaxed text-zinc-500">
          Submit your AI-built projects. Get evaluated by real engineers. Earn verifiable
          credentials that open real doors.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.97]"
          >
            Submit a project
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-11 items-center rounded-lg border border-white/[0.1] bg-white/[0.04] px-6 text-[14px] font-medium text-zinc-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-8 text-[11px] tracking-wide text-zinc-600">
          Trusted by builders from Google, Anthropic, Vercel & more
        </p>
      </section>

      {/* ── Tiers ── */}
      <section className="relative z-10 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Credential Tiers
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Level up as you ship</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.045]"
              >
                <div
                  className="mb-3 h-2 w-2 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <p className="text-[13px] font-semibold">{tier.name}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">{tier.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Why VibeCheck
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to prove you can build
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-6 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/[0.1] text-indigo-400 ring-1 ring-indigo-500/[0.15]">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 text-[14px] font-semibold">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leaderboards ── */}
      <section className="relative z-10 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Curated Rankings
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Admin-picked projects worth studying
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
              Evaluated projects from the current week and month, hand-selected by the evaluator
              team and sorted by score.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RankedProjectList
              title="Weekly Top 10"
              eyebrow="This Week"
              description="The ten strongest projects selected from this week’s evaluated submissions."
              items={leaderboards.weekly}
              emptyMessage="No weekly projects have been selected yet."
              maxHeightClassName="max-h-[36rem]"
            />
            <RankedProjectList
              title="Monthly Top 50"
              eyebrow="This Month"
              description="A broader list of standout projects selected from this month’s evaluations."
              items={leaderboards.monthly}
              emptyMessage="No monthly projects have been selected yet."
              maxHeightClassName="max-h-[36rem]"
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <div
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-10 text-center sm:p-14"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0.02) 60%)',
            }}
          >
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to get verified?
            </h2>
            <p className="mb-8 text-[14px] leading-relaxed text-zinc-500">
              Join hundreds of AI-native developers already building their verified portfolio.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[14px] font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.97]"
            >
              Start for free
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 text-[12px] text-zinc-600 sm:flex-row">
          <span className="font-medium text-zinc-500">VibeCheck</span>
          <p>© 2025 VibeCheck. Verified credentials for AI-native developers.</p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="transition-colors hover:text-zinc-400">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-zinc-400">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
