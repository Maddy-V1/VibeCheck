'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Flame, MessageCircle, Sparkles, ArrowUpRight, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'
import {
  COMMUNITY_REACTIONS,
  type CommunityFeedItem,
  type CommunityFeedResponse,
  type CommunityMinScore,
  type CommunityReactionType,
  type CommunitySort,
  type CommunityTierFilter,
  type CommunityViewer,
} from '@/lib/community/config'

const TIER_LABELS: Record<Exclude<CommunityTierFilter, 'all'>, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(score, 100)
  const hue = pct < 40 ? 0 : pct < 70 ? 45 : pct < 85 ? 160 : 245
  return (
    <div
      className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
      style={{
        background: `conic-gradient(hsla(${hue},80%,55%,0.9) ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        boxShadow: `0 0 24px hsla(${hue},80%,55%,0.15)`,
      }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-bold tabular-nums text-white">
        {Math.round(score)}
      </div>
    </div>
  )
}

function getTierVariant(tier: string) {
  if (tier === 'tier1') return 'tier1'
  if (tier === 'tier2') return 'tier2'
  if (tier === 'tier3') return 'tier3'
  return 'secondary'
}

const TIER_GRADIENT: Record<string, string> = {
  tier1: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
  tier2: 'from-sky-500/15 via-sky-500/5 to-transparent',
  tier3: 'from-violet-500/15 via-violet-500/5 to-transparent',
}

async function fetchCommunityFeed({
  pageParam = 0,
  tier,
  minScore,
  sort,
}: {
  pageParam?: number
  tier: CommunityTierFilter
  minScore: CommunityMinScore
  sort: CommunitySort
}) {
  const params = new URLSearchParams({
    cursor: String(pageParam),
    tier,
    minScore: String(minScore),
    sort,
  })

  const res = await fetch(`/api/community/feed?${params.toString()}`)
  const data = (await res.json()) as CommunityFeedResponse | { error?: string; details?: string }

  if (!res.ok) {
    throw new Error(
      'error' in data && data.error
        ? data.details
          ? `${data.error}: ${data.details}`
          : data.error
        : 'Failed to load community feed'
    )
  }

  return data as CommunityFeedResponse
}

export function CommunityFeed({ viewer }: { viewer: CommunityViewer }) {
  const [tier, setTier] = useState<CommunityTierFilter>('all')
  const [minScore, setMinScore] = useState<CommunityMinScore>(0)
  const [sort, setSort] = useState<CommunitySort>('newest')
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const queryClient = useQueryClient()

  const queryKey = ['community-feed', tier, minScore, sort]

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchCommunityFeed({ pageParam, tier, minScore, sort }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const reactionMutation = useMutation({
    mutationFn: async ({
      projectId,
      reaction,
    }: {
      projectId: string
      reaction: CommunityReactionType
    }) => {
      const res = await fetch(`/api/community/projects/${projectId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update reaction')
      }

      return {
        projectId,
        reactionCounts: data.reactionCounts as CommunityFeedItem['reactionCounts'],
        reactionCount: Number(data.reactionCount ?? 0),
        userReaction: (data.userReaction as CommunityReactionType | null) ?? null,
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, (current: typeof query.data) => {
        if (!current) return current

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.projectId === result.projectId
                ? {
                    ...item,
                    reactionCounts: result.reactionCounts,
                    reactionCount: result.reactionCount,
                    userReaction: result.userReaction,
                  }
                : item
            ),
          })),
        }
      })
    },
  })

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !query.hasNextPage || query.isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void query.fetchNextPage()
        }
      },
      { rootMargin: '320px' }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [query])

  const items = query.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="space-y-6">
      {/* ——— Filter bar ——— */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={tier}
            onChange={(event) => setTier(event.target.value as CommunityTierFilter)}
            className="rounded-full border border-white/[0.08] bg-black/60 px-4 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500/50"
          >
            <option value="all">All tiers</option>
            <option value="tier1">Tier 1</option>
            <option value="tier2">Tier 2</option>
            <option value="tier3">Tier 3</option>
          </select>

          <select
            value={String(minScore)}
            onChange={(event) => setMinScore(Number(event.target.value) as CommunityMinScore)}
            className="rounded-full border border-white/[0.08] bg-black/60 px-4 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500/50"
          >
            <option value="0">Any score</option>
            <option value="60">60+</option>
            <option value="75">75+</option>
            <option value="90">90+</option>
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as CommunitySort)}
            className="rounded-full border border-white/[0.08] bg-black/60 px-4 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500/50"
          >
            <option value="newest">Newest</option>
            <option value="top-scored">Top scored</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            Public feed
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            Reactions require sign-in
          </span>
          {viewer.userId && !viewer.canComment ? (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
              {viewer.evaluatedProjectCount === 0
                ? 'Submit a project to unlock comments'
                : 'Community access must be active to comment'}
            </span>
          ) : null}
        </div>
      </section>

      {/* ——— Loading ——— */}
      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[26rem] animate-pulse rounded-[26px] border border-white/[0.06] bg-white/[0.03]"
            />
          ))}
        </div>
      ) : null}

      {/* ——— Empty ——— */}
      {!query.isLoading && items.length === 0 ? (
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] px-6 py-16 text-center">
          <Sparkles className="mx-auto mb-4 h-6 w-6 text-zinc-600" />
          <h2 className="text-lg font-semibold text-white">No projects match these filters</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Try widening the score threshold or switching back to all tiers.
          </p>
        </section>
      ) : null}

      {/* ——— Cards grid ——— */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const tierGradient = TIER_GRADIENT[item.tier] || TIER_GRADIENT.tier1!

          return (
            <article
              key={item.projectId}
              className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-zinc-950 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/[0.14] hover:shadow-2xl hover:shadow-black/40"
            >
              {/* Tier gradient header */}
              <div className={`h-24 w-full bg-gradient-to-b ${tierGradient}`}>
                <div className="flex h-full items-start justify-between p-5">
                  <ScoreRing score={item.score} />
                  <div className="text-right">
                    <Badge variant={getTierVariant(item.tier)}>
                      <TierBadgeImage tier={item.tier} size={14} className="mr-1.5" />
                      {TIER_LABELS[item.tier as keyof typeof TIER_LABELS] ?? 'Tier'}
                    </Badge>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      {formatDistanceToNow(new Date(item.evaluatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content body */}
              <div className="flex flex-1 flex-col p-5 pt-4">
                {/* Title & description */}
                <h2 className="line-clamp-1 text-lg font-semibold text-white transition-colors group-hover:text-indigo-300">
                  {item.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-[13px] leading-6 text-zinc-500">
                  {item.description || 'No project description provided.'}
                </p>

                {/* Tech stack */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.techStack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-zinc-500"
                    >
                      {tech}
                    </span>
                  ))}
                  {item.techStack.length > 4 && (
                    <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-600">
                      +{item.techStack.length - 4}
                    </span>
                  )}
                </div>

                {/* Evaluator note */}
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    Evaluator note
                  </p>
                  <p className="line-clamp-2 text-[12px] leading-5 text-zinc-400">
                    {item.reviewerNote}
                  </p>
                </div>

                {/* Author bar */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    href={`/u/${item.username}`}
                    className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.displayName || item.username || 'Community member'}
                        className="h-8 w-8 rounded-full border border-white/[0.08] object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-[11px] font-bold text-white">
                        {(item.displayName || item.username || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[12px] font-medium text-zinc-300">
                        {item.displayName || item.username || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-zinc-600">@{item.username || 'member'}</p>
                    </div>
                  </Link>

                  <Link
                    href={`/badge/${item.projectId}#comments`}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-500 transition-all hover:border-white/[0.12] hover:text-white"
                  >
                    <MessageCircle size={12} />
                    {item.commentCount}
                  </Link>
                </div>

                {/* ——— Reactions & actions ——— */}
                <div className="mt-auto space-y-3 pt-4">
                  {/* Reactions */}
                  <div className="flex flex-wrap gap-1.5">
                    {COMMUNITY_REACTIONS.map((reaction) => {
                      const isActive = item.userReaction === reaction.type
                      const count = item.reactionCounts[reaction.type]

                      return (
                        <button
                          key={reaction.type}
                          type="button"
                          onClick={() => {
                            if (!viewer.userId) {
                              window.alert('Sign in to react to community projects.')
                              return
                            }
                            reactionMutation.mutate({
                              projectId: item.projectId,
                              reaction: reaction.type,
                            })
                          }}
                          disabled={reactionMutation.isPending}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all duration-200 ${
                            isActive
                              ? 'scale-105 border-indigo-500/30 bg-indigo-500/15 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                              : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <span className="text-sm">{reaction.emoji}</span>
                          <span className="tabular-nums">{count}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-3">
                    {item.liveUrl ? (
                      <a
                        href={item.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-all hover:border-white/[0.12] hover:text-white"
                      >
                        <ExternalLink size={12} />
                        Live
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-700">No live URL</span>
                    )}

                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/badge/${item.projectId}#comments`}>
                          <MessageCircle className="mr-1 h-3.5 w-3.5" />
                          Comment
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/badge/${item.projectId}`} className="gap-1">
                          View
                          <ArrowUpRight size={12} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* ——— Error ——— */}
      {query.isError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {(query.error as Error).message}
        </div>
      ) : null}

      <div ref={sentinelRef} />

      {query.isFetchingNextPage ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-white/[0.1] border-t-indigo-400" />
          <p className="text-[12px] text-zinc-600">Loading more projects…</p>
        </div>
      ) : null}
    </div>
  )
}
