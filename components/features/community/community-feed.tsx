'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Flame, MessageCircle, Sparkles } from 'lucide-react'
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
  return (
    <div
      className="relative flex h-14 w-14 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(rgba(129, 140, 248, 0.95) ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
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

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-[26px] border border-white/[0.06] bg-white/[0.03]"
            />
          ))}
        </div>
      ) : null}

      {!query.isLoading && items.length === 0 ? (
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] px-6 py-16 text-center">
          <Sparkles className="mx-auto mb-4 h-6 w-6 text-zinc-600" />
          <h2 className="text-lg font-semibold text-white">No projects match these filters</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Try widening the score threshold or switching back to all tiers.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.projectId}
            className="group flex h-full flex-col rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 transition-all hover:-translate-y-1 hover:border-white/[0.16]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <ScoreRing score={item.score} />
              <div className="text-right">
                <Badge variant={getTierVariant(item.tier)}>
                  <TierBadgeImage tier={item.tier} size={14} className="mr-1.5" />
                  {TIER_LABELS[item.tier as keyof typeof TIER_LABELS] ?? 'Tier'}
                </Badge>
                <p className="mt-3 text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(item.evaluatedAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="line-clamp-1 text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-zinc-500">
                {item.description || 'No project description provided.'}
              </p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {item.techStack.slice(0, 5).map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-400"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mb-4 rounded-2xl border border-white/[0.06] bg-black/30 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Evaluator note
              </p>
              <p className="line-clamp-3 text-sm leading-6 text-zinc-300">{item.reviewerNote}</p>
            </div>

            <div className="mb-4 flex items-center justify-between gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item.displayName || item.username || 'Community member'}
                    className="h-9 w-9 rounded-full border border-white/[0.08] object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-white">
                    {(item.displayName || item.username || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm text-white">
                    {item.displayName || item.username || 'Anonymous'}
                  </p>
                  <p>@{item.username || 'member'}</p>
                </div>
              </div>
              <Link
                href={`/badge/${item.projectId}#comments`}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 transition-colors hover:border-white/[0.16] hover:text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {item.commentCount}
              </Link>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_REACTIONS.map((reaction) => {
                  const isActive = item.userReaction === reaction.type

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
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-indigo-500/14 border-indigo-500/30 text-indigo-200'
                          : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{reaction.emoji}</span>
                      <span>{item.reactionCounts[reaction.type]}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between gap-3">
                {item.liveUrl ? (
                  <a
                    href={item.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    <Flame className="h-4 w-4" />
                    Live project
                  </a>
                ) : (
                  <span className="text-sm text-zinc-600">No live URL listed</span>
                )}

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/badge/${item.projectId}#comments`}>
                      <MessageCircle className="mr-1.5 h-4 w-4" />
                      Comment
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/badge/${item.projectId}`}>View →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {query.isError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {(query.error as Error).message}
        </div>
      ) : null}

      <div ref={sentinelRef} />

      {query.isFetchingNextPage ? (
        <div className="py-4 text-center text-sm text-zinc-500">Loading more projects…</div>
      ) : null}
    </div>
  )
}
