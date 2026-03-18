'use client'

import Link from 'next/link'
import { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Rocket, Clock, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { RankedProjectList } from '@/components/features/leaderboard/ranked-project-list'
import type { RankedProject } from '@/lib/utils/leaderboard'

interface LockedDashboardProps {
  profile: Profile
  hasSubmittedProject: boolean
  queuePosition?: number
  estimatedDays?: number
  leaderboards: {
    weekly: RankedProject[]
    monthly: RankedProject[]
  }
}

export function LockedDashboard({
  profile,
  hasSubmittedProject,
  queuePosition,
  estimatedDays,
  leaderboards,
}: LockedDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome, {profile.display_name || 'there'} 👋
        </h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Your journey starts here. Submit a project to get evaluated.
        </p>
      </div>

      {/* Main CTA or Queue tracker */}
      {hasSubmittedProject && queuePosition ? (
        /* Queue Tracker */
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={16} className="text-indigo-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-400">
              In the Queue
            </p>
          </div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums text-white">#{queuePosition}</span>
            <span className="text-[13px] text-zinc-500">position</span>
          </div>
          {estimatedDays && (
            <p className="mb-4 text-[13px] text-zinc-500">
              Estimated ~{estimatedDays} days until evaluation
            </p>
          )}
          {/* Progress mockup */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${Math.max(10, Math.min(90, 100 - queuePosition * 5))}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] text-zinc-600">
            We'll notify you by email and in-app when your evaluation is ready.
          </p>
        </div>
      ) : (
        /* Submit CTA */
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <Rocket size={20} className="text-indigo-400" />
          </div>
          <h2 className="mb-1 text-lg font-bold text-white">Your first project is one step away</h2>
          <p className="mx-auto mb-5 max-w-md text-[13px] text-zinc-500">
            Submit your project for expert evaluation. Get a score, earn a badge, and unlock your
            public profile.
          </p>
          <Link href="/dashboard/submit">
            <Button size="lg">
              Submit Your First Project
              <ArrowRight size={15} className="ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* What you'll unlock */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={14} className="text-zinc-600" />
          <h3 className="text-[13px] font-semibold text-zinc-400">
            What you'll unlock after your first evaluation
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Sparkles size={16} className="text-indigo-400" />,
              title: 'Public Profile',
              desc: 'A shareable portfolio page showcasing your evaluated projects and scores.',
            },
            {
              icon: (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 15l-3-3m0 0l3-3m-3 3h8M2 12a10 10 0 1020 0 10 10 0 00-20 0z" />
                </svg>
              ),
              title: 'Verifiable Badge',
              desc: 'A unique badge with verification ID that you can share on LinkedIn, GitHub, etc.',
            },
            {
              icon: (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              title: 'Community Access',
              desc: 'Join discussions, share feedback, and connect with other vibe coders.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="mb-2.5">{item.icon}</div>
              <h4 className="mb-1 text-[13px] font-semibold text-white">{item.title}</h4>
              <p className="text-[11px] leading-relaxed text-zinc-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Blurred profile preview */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
        <div className="pointer-events-none p-6 opacity-40 blur-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
            <div>
              <div className="mb-2 h-5 w-32 rounded bg-white/[0.1]" />
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="mb-2 h-4 w-20 rounded bg-white/[0.08]" />
                <div className="h-3 w-full rounded bg-white/[0.04]" />
                <div className="mt-1 h-3 w-3/4 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center">
            <Lock size={20} className="mx-auto mb-2 text-zinc-500" />
            <p className="text-[13px] font-semibold text-zinc-400">Your public profile</p>
            <p className="text-[11px] text-zinc-600">Unlocks after your first evaluation</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RankedProjectList
          title="Weekly Top 10"
          eyebrow="What Great Looks Like"
          description="See the projects the evaluator team is spotlighting this week."
          items={leaderboards.weekly}
          emptyMessage="The weekly top 10 will appear here once the admin team publishes it."
          maxHeightClassName="max-h-[24rem]"
        />
        <RankedProjectList
          title="Monthly Top 50"
          eyebrow="What Great Looks Like"
          description="A larger board of standout projects from the current month."
          items={leaderboards.monthly}
          emptyMessage="The monthly top 50 will appear here once the admin team publishes it."
          maxHeightClassName="max-h-[24rem]"
        />
      </div>
    </div>
  )
}
