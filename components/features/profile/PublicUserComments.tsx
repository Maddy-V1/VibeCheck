'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, ArrowUpRight } from 'lucide-react'

interface UserComment {
  id: string
  body: string
  createdAt: string
  isEdited: boolean
  projectId: string
  projectTitle: string
}

interface PublicUserCommentsProps {
  comments: UserComment[]
  username: string
}

export function PublicUserComments({ comments, username }: PublicUserCommentsProps) {
  if (comments.length === 0) return null

  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <MessageCircle size={16} className="text-zinc-500" />
        <h2 className="text-[15px] font-semibold text-white">
          Recent Activity ({comments.length})
        </h2>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <Link
            key={comment.id}
            href={`/badge/${comment.projectId}#comments`}
            className="group block rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            {/* Project reference */}
            <div className="mb-2.5 flex items-center gap-2">
              <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Comment
              </span>
              <span className="flex items-center gap-1 text-[12px] text-zinc-600 transition-colors group-hover:text-indigo-400">
                on {comment.projectTitle || 'a project'}
                <ArrowUpRight
                  size={11}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                />
              </span>
            </div>

            {/* Comment body */}
            <p className="line-clamp-3 text-[13px] leading-relaxed text-zinc-400">{comment.body}</p>

            {/* Meta */}
            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-zinc-700">
              <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
              {comment.isEdited && <span>(edited)</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
