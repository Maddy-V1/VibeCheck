import Link from 'next/link'
import { ArrowUpRight, Trophy } from 'lucide-react'
import type { RankedProject } from '@/lib/utils/leaderboard'

interface RankedProjectListProps {
  title: string
  eyebrow: string
  description: string
  items: RankedProject[]
  emptyMessage: string
  maxHeightClassName?: string
}

export function RankedProjectList({
  title,
  eyebrow,
  description,
  items,
  emptyMessage,
  maxHeightClassName = 'max-h-[32rem]',
}: RankedProjectListProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
          {eyebrow}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{description}</p>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-400">
            {items.length}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Trophy className="mx-auto mb-3 text-zinc-700" size={20} />
          <p className="text-[13px] text-zinc-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className={`${maxHeightClassName} overflow-y-auto`}>
          <div className="divide-y divide-white/[0.05]">
            {items.map((item, index) => (
              <Link
                key={`${item.projectId}-${item.evaluatedAt}`}
                href={`/badge/${item.projectId}`}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[12px] font-bold tabular-nums text-white">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-white">{item.title}</p>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      {item.confirmedTier.replace('tier', 'T')}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-zinc-500">by @{item.username}</p>

                  {item.techStack.length > 0 && (
                    <p className="mt-2 truncate text-[11px] text-zinc-600">
                      {item.techStack.slice(0, 4).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold tabular-nums text-white">
                    {item.score.toFixed(0)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">score</p>
                  <ArrowUpRight size={12} className="ml-auto mt-2 text-indigo-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
