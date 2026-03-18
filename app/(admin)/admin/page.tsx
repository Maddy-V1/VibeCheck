'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, ArrowRight, Users, Clock, Zap, Trophy, BarChart3, Sparkles } from 'lucide-react'

interface QueueItem {
  id: string
  position: number
  plan: string
  entered_at: string
  assigned_to: string | null
  projects: {
    id: string
    title: string
    tier: string
    tech_stack: string[] | null
  } | null
  profiles: {
    username: string
  } | null
}

interface EvaluatorProfile {
  id: string
  username: string
  display_name: string
}

interface RankedProject {
  projectId: string
  title: string
  username: string
  displayName: string | null
  score: number
  tier: string
  confirmedTier: string
  techStack: string[]
  evaluatedAt: string
}

interface RankingBucket {
  label: string
  maxSelections: number
  selected: RankedProject[]
  selectedProjectIds: string[]
  eligible: RankedProject[]
  unavailable?: boolean
}

interface ProfileRatingItem {
  userId: string
  username: string
  displayName: string | null
  evaluatedCount: number
  currentRating: number | null
  currentLevel: string | null
  computedRating: number | null
  computedLevel: string | null
  isPublic: boolean
  needsSync: boolean
  lastEvaluatedAt: string | null
}

type AdminSection = 'queue' | 'weekly' | 'monthly' | 'ratings'

export default function AdminQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [profile, setProfile] = useState<EvaluatorProfile | null>(null)
  const [weeklyRankings, setWeeklyRankings] = useState<RankingBucket | null>(null)
  const [monthlyRankings, setMonthlyRankings] = useState<RankingBucket | null>(null)
  const [profileRatings, setProfileRatings] = useState<ProfileRatingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankingWarning, setRankingWarning] = useState<string | null>(null)
  const [ratingsWarning, setRatingsWarning] = useState<string | null>(null)
  const [rankingActionKey, setRankingActionKey] = useState<string | null>(null)
  const [ratingSyncing, setRatingSyncing] = useState(false)
  const [activeSection, setActiveSection] = useState<AdminSection>('queue')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    setRankingWarning(null)
    setRatingsWarning(null)
    try {
      const queueRes = await fetch('/api/admin/queue/list')

      if (!queueRes.ok) throw new Error('Failed to fetch queue')

      const { queue, evaluator } = await queueRes.json()

      setQueueItems(queue || [])
      setProfile(evaluator || null)

      try {
        const [rankingsRes, ratingsRes] = await Promise.all([
          fetch('/api/admin/rankings'),
          fetch('/api/admin/profile-ratings'),
        ])

        if (!rankingsRes.ok) {
          const rankingError = await rankingsRes.json().catch(() => null)
          setWeeklyRankings(null)
          setMonthlyRankings(null)
          setRankingWarning(
            rankingError?.error ||
              'Rankings are unavailable right now. Queue management still works.'
          )
        } else {
          const rankings = await rankingsRes.json()
          setWeeklyRankings(rankings.weekly || null)
          setMonthlyRankings(rankings.monthly || null)

          if (rankings.rankingsUnavailable) {
            setRankingWarning(
              'Rankings are not ready yet. Run the latest Supabase ranking migration to enable weekly and monthly picks.'
            )
          }
        }

        if (!ratingsRes.ok) {
          const ratingsError = await ratingsRes.json().catch(() => null)
          setProfileRatings([])
          setRatingsWarning(ratingsError?.error || 'Profile ratings are unavailable right now.')
        } else {
          const ratings = await ratingsRes.json()
          setProfileRatings(ratings.profiles || [])
        }
      } catch (rankingError) {
        console.error('Failed to load admin extras:', rankingError)
        setWeeklyRankings(null)
        setMonthlyRankings(null)
        setProfileRatings([])
        setRankingWarning('Rankings are unavailable right now. Queue management still works.')
        setRatingsWarning('Profile ratings are unavailable right now.')
      }
    } catch (err) {
      console.error('Failed to load queue:', err)
      setError('Failed to load admin queue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncProfileRatings = async () => {
    setRatingSyncing(true)

    try {
      const res = await fetch('/api/admin/profile-ratings', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to sync profile ratings')
        return
      }

      setProfileRatings(data.profiles || [])
      setRatingsWarning(null)
    } catch (err) {
      console.error('Profile rating sync failed:', err)
      alert('Failed to sync profile ratings')
    } finally {
      setRatingSyncing(false)
    }
  }

  const handlePickup = async (projectId: string) => {
    try {
      const res = await fetch('/api/admin/queue/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to pick up project')
        return
      }
      window.location.href = `/admin/evaluate/${projectId}`
    } catch {
      alert('Failed to pick up project')
    }
  }

  const handleToggleRanking = async (
    periodType: 'weekly' | 'monthly',
    projectId: string,
    selected: boolean
  ) => {
    const actionKey = `${periodType}:${projectId}`
    setRankingActionKey(actionKey)

    try {
      const res = await fetch('/api/admin/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodType,
          projectId,
          selected,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to update rankings')
        return
      }

      if (data.weekly) {
        setWeeklyRankings(data.weekly)
      }

      if (data.monthly) {
        setMonthlyRankings(data.monthly)
      }
    } catch (err) {
      console.error('Ranking update failed:', err)
      alert('Failed to update rankings')
    } finally {
      setRankingActionKey(null)
    }
  }

  const totalInQueue = queueItems.length
  const myActive = queueItems.filter((item) => item.assigned_to === profile?.id).length
  const unassigned = queueItems.filter((item) => !item.assigned_to).length
  const ratingNeedsSyncCount = profileRatings.filter((item) => item.needsSync).length
  const ratingEligibleCount = profileRatings.filter((item) => item.evaluatedCount >= 3).length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex items-center gap-3 text-zinc-500">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-[13px]">Loading queue…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Evaluation Queue</h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              Pick up projects, review, and submit evaluations
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Total
              </p>
              <Users size={14} className="text-zinc-600" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-white">{totalInQueue}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                My Active
              </p>
              <Clock size={14} className="text-indigo-400" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-indigo-400">{myActive}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Unassigned
              </p>
              <Zap size={14} className="text-amber-400" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-amber-400">{unassigned}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Weekly Picks
              </p>
              <Trophy size={14} className="text-violet-400" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-violet-400">
              {weeklyRankings?.selected.length ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Rating Sync
              </p>
              <BarChart3 size={14} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-emerald-400">
              {ratingNeedsSyncCount}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { id: 'queue', label: 'Project Queue' },
            { id: 'weekly', label: 'Top 10 Weekly' },
            { id: 'monthly', label: 'Top 50 Monthly' },
            { id: 'ratings', label: 'Profile Rating' },
          ].map((section) => {
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id as AdminSection)}
                className={`rounded-full border px-4 py-2 text-[12px] font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-500/12 border-indigo-500/30 text-indigo-300'
                    : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-[12px] text-red-400">
            {error}
          </div>
        )}

        {rankingWarning && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[12px] text-amber-300">
            {rankingWarning}
          </div>
        )}

        {ratingsWarning && activeSection === 'ratings' && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[12px] text-amber-300">
            {ratingsWarning}
          </div>
        )}

        {activeSection === 'queue' ? (
          queueItems.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-16 text-center">
              <Clock size={28} className="mx-auto mb-3 text-zinc-700" />
              <p className="mb-1 text-[15px] font-semibold text-white">Queue is empty</p>
              <p className="text-[13px] text-zinc-500">No projects waiting for evaluation</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025]">
              {/* Table header */}
              <div className="grid grid-cols-[50px_1fr_80px_60px_100px_100px_100px] gap-4 border-b border-white/[0.06] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                <span>#</span>
                <span>Project</span>
                <span>Tier</span>
                <span>Plan</span>
                <span>User</span>
                <span>Submitted</span>
                <span className="text-right">Action</span>
              </div>

              {/* Rows */}
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[50px_1fr_80px_60px_100px_100px_100px] items-center gap-4 border-b border-white/[0.04] px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  {/* Position */}
                  <span className="text-[13px] font-bold tabular-nums text-zinc-400">
                    {item.position}
                  </span>

                  {/* Project */}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-white">
                      {item.projects?.title || 'Unknown'}
                    </p>
                    <p className="truncate text-[11px] text-zinc-700">
                      {item.projects?.tech_stack?.slice(0, 3).join(', ') || 'No stack'}
                    </p>
                  </div>

                  {/* Tier */}
                  <Badge
                    variant={
                      item.projects?.tier === 'tier1'
                        ? 'tier1'
                        : item.projects?.tier === 'tier2'
                          ? 'tier2'
                          : item.projects?.tier === 'tier3'
                            ? 'tier3'
                            : 'secondary'
                    }
                  >
                    {item.projects?.tier?.replace('tier', 'T') || '—'}
                  </Badge>

                  {/* Plan */}
                  {item.plan === 'priority' ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                      <Zap size={11} /> PRI
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-600">FREE</span>
                  )}

                  {/* User */}
                  <span className="truncate text-[12px] text-zinc-400">
                    @{item.profiles?.username || '—'}
                  </span>

                  {/* Date */}
                  <span className="text-[11px] tabular-nums text-zinc-600">
                    {new Date(item.entered_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>

                  {/* Action */}
                  <div className="text-right">
                    {item.assigned_to === profile?.id ? (
                      <Link
                        href={`/admin/evaluate/${item.projects?.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                      >
                        Continue <ArrowRight size={12} />
                      </Link>
                    ) : item.assigned_to ? (
                      <span className="text-[11px] text-zinc-700">Assigned</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => item.projects?.id && handlePickup(item.projects.id)}
                        className="text-[12px] text-indigo-400 hover:text-indigo-300"
                      >
                        Pick Up
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        {activeSection === 'weekly' ? (
          <RankingSelector
            title="Weekly Top 10"
            description="Select up to 10 projects from this week’s evaluated submissions."
            periodType="weekly"
            bucket={weeklyRankings}
            rankingActionKey={rankingActionKey}
            onToggle={handleToggleRanking}
          />
        ) : null}

        {activeSection === 'monthly' ? (
          <RankingSelector
            title="Monthly Top 50"
            description="Select up to 50 projects from this month’s evaluated submissions."
            periodType="monthly"
            bucket={monthlyRankings}
            rankingActionKey={rankingActionKey}
            onToggle={handleToggleRanking}
          />
        ) : null}

        {activeSection === 'ratings' ? (
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.025]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  <Sparkles size={11} className="text-emerald-400" />
                  Phase 2
                </div>
                <h2 className="text-[15px] font-semibold text-white">Profile Rating</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                  Users unlock public profiles after 1 evaluation, and profile rating goes live
                  after 3 evaluated projects.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-400">
                  Eligible: {ratingEligibleCount}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncProfileRatings}
                  disabled={ratingSyncing}
                >
                  <RefreshCw
                    size={13}
                    className={`mr-1.5 ${ratingSyncing ? 'animate-spin' : ''}`}
                  />
                  {ratingSyncing ? 'Syncing...' : 'Sync Ratings'}
                </Button>
              </div>
            </div>

            {profileRatings.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <BarChart3 size={24} className="mx-auto mb-3 text-zinc-700" />
                <p className="text-[13px] text-zinc-500">No evaluated users yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[920px] divide-y divide-white/[0.05]">
                  <div className="grid grid-cols-[1.3fr_110px_130px_130px_100px_120px] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                    <span>User</span>
                    <span>Evaluated</span>
                    <span>Current</span>
                    <span>Computed</span>
                    <span>Public</span>
                    <span>Status</span>
                  </div>
                  {profileRatings.map((item) => (
                    <div
                      key={item.userId}
                      className="grid grid-cols-[1.3fr_110px_130px_130px_100px_120px] gap-4 px-5 py-4 text-[12px]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {item.displayName || item.username}
                        </p>
                        <p className="mt-1 truncate text-zinc-500">@{item.username}</p>
                      </div>
                      <div className="tabular-nums text-zinc-300">{item.evaluatedCount}</div>
                      <div>
                        <p className="font-medium text-zinc-300">
                          {item.currentRating !== null
                            ? `${item.currentRating.toFixed(1)}`
                            : 'Locked'}
                        </p>
                        <p className="mt-1 text-zinc-600">{item.currentLevel || 'No level'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {item.computedRating !== null
                            ? `${item.computedRating.toFixed(1)}`
                            : item.evaluatedCount >= 3
                              ? 'Pending'
                              : 'Need 3'}
                        </p>
                        <p className="mt-1 text-zinc-500">{item.computedLevel || 'Locked'}</p>
                      </div>
                      <div className="text-zinc-400">{item.isPublic ? 'Yes' : 'No'}</div>
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                            item.needsSync
                              ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {item.needsSync ? 'Needs Sync' : 'Synced'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function RankingSelector({
  title,
  description,
  periodType,
  bucket,
  rankingActionKey,
  onToggle,
}: {
  title: string
  description: string
  periodType: 'weekly' | 'monthly'
  bucket: RankingBucket | null
  rankingActionKey: string | null
  onToggle: (
    periodType: 'weekly' | 'monthly',
    projectId: string,
    selected: boolean
  ) => Promise<void>
}) {
  const selectedIds = new Set(bucket?.selectedProjectIds ?? [])

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              <Trophy size={11} className="text-amber-400" />
              {bucket?.label || (periodType === 'weekly' ? 'This Week' : 'This Month')}
            </div>
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{description}</p>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-400">
            {bucket?.selected.length ?? 0}/
            {bucket?.maxSelections ?? (periodType === 'weekly' ? 10 : 50)}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
            Selected
          </p>
          {bucket?.selected.length ? (
            <div className="flex flex-wrap gap-2">
              {bucket.selected.map((project) => (
                <button
                  key={`${periodType}-selected-${project.projectId}`}
                  type="button"
                  onClick={() => onToggle(periodType, project.projectId, false)}
                  disabled={rankingActionKey === `${periodType}:${project.projectId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/15 disabled:opacity-60"
                >
                  <span>{project.title}</span>
                  <span className="text-indigo-400">{project.score.toFixed(0)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-zinc-600">No projects selected yet.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
            Eligible Projects
          </p>

          {bucket?.eligible.length ? (
            <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {bucket.eligible.map((project) => {
                const isSelected = selectedIds.has(project.projectId)
                const actionKey = `${periodType}:${project.projectId}`

                return (
                  <div
                    key={`${periodType}-${project.projectId}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-white">{project.title}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        @{project.username} · {project.confirmedTier.replace('tier', 'T')} ·{' '}
                        {project.score.toFixed(0)}
                      </p>
                      {project.techStack.length > 0 && (
                        <p className="mt-1 truncate text-[11px] text-zinc-700">
                          {project.techStack.slice(0, 4).join(', ')}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? 'secondary' : 'ghost'}
                      disabled={rankingActionKey === actionKey}
                      onClick={() => onToggle(periodType, project.projectId, !isSelected)}
                    >
                      {rankingActionKey === actionKey
                        ? 'Saving...'
                        : isSelected
                          ? 'Remove'
                          : 'Select'}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[12px] text-zinc-600">
              No evaluated public projects are available for this period yet.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
