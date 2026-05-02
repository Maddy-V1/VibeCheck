'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ThumbsUp, MessageCircle, ArrowUpRight } from 'lucide-react'

interface UserReaction {
  id: string
  reactionType: string
  createdAt: string
  projectId: string
  projectTitle: string
}

interface UserComment {
  id: string
  body: string
  createdAt: string
  isEdited: boolean
  projectId: string
  projectTitle: string
}

interface SettingsActivityProps {
  reactions: UserReaction[]
  comments: UserComment[]
}

const REACTION_EMOJI: Record<string, string> = {
  celebrate: '👏',
  fire: '🔥',
  insightful: '🤯',
  like: '👍',
  helpful: '💡',
}

export function SettingsActivity({ reactions, comments }: SettingsActivityProps) {
  return (
    <div className="space-y-6">
      {/* Reactions Section */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.025]">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <ThumbsUp size={14} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Your Reactions</h2>
              <p className="mt-0.5 text-[12px] text-zinc-600">
                {reactions.length} reaction{reactions.length !== 1 ? 's' : ''} on community projects
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {reactions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-zinc-600">No reactions yet</p>
              <p className="mt-1 text-[11px] text-zinc-700">
                React to projects in the community feed to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {reactions.slice(0, 15).map((reaction) => (
                <Link
                  key={reaction.id}
                  href={`/badge/${reaction.projectId}`}
                  className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-base">
                    {REACTION_EMOJI[reaction.reactionType] || '👍'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[13px] text-zinc-400 group-hover:text-white">
                      {reaction.projectTitle || 'A project'}
                      <ArrowUpRight
                        size={11}
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </p>
                    <p className="text-[11px] text-zinc-700">
                      {formatDistanceToNow(new Date(reaction.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
              {reactions.length > 15 && (
                <p className="pt-2 text-center text-[11px] text-zinc-600">
                  and {reactions.length - 15} more reaction{reactions.length - 15 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Comments Section */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.025]">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <MessageCircle size={14} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Your Comments</h2>
              <p className="mt-0.5 text-[12px] text-zinc-600">
                {comments.length} comment{comments.length !== 1 ? 's' : ''} on projects
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {comments.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-zinc-600">No comments yet</p>
              <p className="mt-1 text-[11px] text-zinc-700">
                Comment on projects in the community to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.slice(0, 15).map((comment) => (
                <Link
                  key={comment.id}
                  href={`/badge/${comment.projectId}#comments`}
                  className="group block rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  <div className="mb-1.5 flex items-center gap-2 text-[11px] text-zinc-600">
                    <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Comment
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-indigo-400">
                      on {comment.projectTitle || 'a project'}
                      <ArrowUpRight
                        size={10}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-zinc-400 group-hover:text-zinc-300">
                    {comment.body}
                  </p>
                  <p className="mt-1.5 text-[11px] text-zinc-700">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    {comment.isEdited && ' · edited'}
                  </p>
                </Link>
              ))}
              {comments.length > 15 && (
                <p className="pt-2 text-center text-[11px] text-zinc-600">
                  and {comments.length - 15} more comment{comments.length - 15 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
