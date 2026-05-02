'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Flag, MessageCircle, Reply, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type {
  CommunityViewer,
  ProjectComment,
  ProjectCommentsResponse,
} from '@/lib/community/config'
import { cn } from '@/lib/utils/cn'

async function fetchProjectComments(projectId: string) {
  const res = await fetch(`/api/community/projects/${projectId}/comments`)
  const data = (await res.json()) as ProjectCommentsResponse | { error?: string }

  if (!res.ok) {
    throw new Error('error' in data && data.error ? data.error : 'Failed to load comments')
  }

  return data as ProjectCommentsResponse
}

export function ProjectComments({
  projectId,
  projectOwnerId,
  viewer,
  className,
  previewMode = false,
}: {
  projectId: string
  projectOwnerId: string
  viewer: CommunityViewer
  className?: string
  previewMode?: boolean
}) {
  const [draft, setDraft] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [showAll, setShowAll] = useState(!previewMode)
  const queryClient = useQueryClient()
  const canCurrentUserComment = viewer.canComment || viewer.userId === projectOwnerId

  const query = useQuery({
    queryKey: ['project-comments', projectId],
    queryFn: () => fetchProjectComments(projectId),
  })

  const addCommentMutation = useMutation({
    mutationFn: async ({
      body,
      parentCommentId,
    }: {
      body: string
      parentCommentId: string | null
    }) => {
      const res = await fetch(`/api/community/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, parentCommentId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add comment')
      }

      return data as ProjectCommentsResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['project-comments', projectId], data)
      setDraft('')
      setReplyDraft('')
      setReplyingTo(null)
    },
  })

  const reportMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/community/comments/${commentId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'other' }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to report comment')
      }

      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] })
    },
  })

  const comments = query.data?.comments ?? []
  const totalCommentCount = comments.reduce(
    (count, comment) => count + 1 + comment.replies.length,
    0
  )
  const displayedComments = showAll ? comments : comments.slice(0, 2)
  const hasMore = !showAll && comments.length > 2

  return (
    <section
      id="comments"
      className={cn(
        'scroll-mt-24 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6',
        className
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Discussion
          </p>
          <h2 className="text-xl font-semibold text-white">
            Community comments ({totalCommentCount})
          </h2>
        </div>
        <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-500">
          1 level of replies
        </div>
      </div>

      {!viewer.userId ? (
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-4 text-sm text-zinc-400">
          <p className="text-white">Sign in to join the conversation.</p>
          <Link href="/sign-in" className="mt-2 inline-flex text-indigo-300 hover:text-indigo-200">
            Go to sign in →
          </Link>
        </div>
      ) : null}

      {viewer.userId && !canCurrentUserComment ? (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-200">
          {viewer.evaluatedProjectCount === 0
            ? 'Submit a project to join the conversation'
            : 'Your community status must be active to comment right now.'}
        </div>
      ) : null}

      {canCurrentUserComment && !previewMode ? (
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-black/30 p-4">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share a thought about this project..."
            maxLength={2000}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-zinc-600">{draft.trim().length}/2000</p>
            <Button
              size="sm"
              onClick={() =>
                addCommentMutation.mutate({ body: draft.trim(), parentCommentId: null })
              }
              disabled={addCommentMutation.isPending || draft.trim().length === 0}
            >
              Post comment
            </Button>
          </div>
          {addCommentMutation.isError ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {(addCommentMutation.error as Error).message}
            </div>
          ) : null}
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: previewMode ? 2 : 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
            />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {(query.error as Error).message}
        </div>
      ) : null}

      {!query.isLoading && !query.isError && comments.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-10 text-center text-sm text-zinc-500">
          No comments yet. The first thoughtful take wins.
        </div>
      ) : null}

      <div className="space-y-5">
        {displayedComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            viewer={viewer}
            projectOwnerId={projectOwnerId}
            canCurrentUserComment={canCurrentUserComment && !previewMode}
            replyingTo={replyingTo}
            replyDraft={replyDraft}
            onReplyDraftChange={setReplyDraft}
            onReplyToggle={(commentId) => {
              setReplyingTo((current) => (current === commentId ? null : commentId))
              setReplyDraft('')
            }}
            onReplySubmit={(commentId) =>
              addCommentMutation.mutate({ body: replyDraft.trim(), parentCommentId: commentId })
            }
            onReport={(commentId) => reportMutation.mutate(commentId)}
            isSubmitting={addCommentMutation.isPending}
            isReporting={reportMutation.isPending}
          />
        ))}
      </div>

      {/* See more button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAll(true)}
            className="gap-1.5"
          >
            <ChevronDown size={14} />
            See all {comments.length} comments
          </Button>
        </div>
      )}
    </section>
  )
}

function CommentThread({
  comment,
  viewer,
  projectOwnerId,
  canCurrentUserComment,
  replyingTo,
  replyDraft,
  onReplyDraftChange,
  onReplyToggle,
  onReplySubmit,
  onReport,
  isSubmitting,
  isReporting,
}: {
  comment: ProjectComment
  viewer: CommunityViewer
  projectOwnerId: string
  canCurrentUserComment: boolean
  replyingTo: string | null
  replyDraft: string
  onReplyDraftChange: (value: string) => void
  onReplyToggle: (commentId: string) => void
  onReplySubmit: (commentId: string) => void
  onReport: (commentId: string) => void
  isSubmitting: boolean
  isReporting: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <CommentCard
        comment={comment}
        viewer={viewer}
        projectOwnerId={projectOwnerId}
        canCurrentUserComment={canCurrentUserComment}
        canReply
        isReplying={replyingTo === comment.id}
        replyDraft={replyDraft}
        onReplyDraftChange={onReplyDraftChange}
        onReplyToggle={() => onReplyToggle(comment.id)}
        onReplySubmit={() => onReplySubmit(comment.id)}
        onReport={() => onReport(comment.id)}
        isSubmitting={isSubmitting}
        isReporting={isReporting}
      />

      {comment.replies.length > 0 ? (
        <div className="mt-4 space-y-3 border-l border-white/[0.06] pl-4">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              viewer={viewer}
              projectOwnerId={projectOwnerId}
              canCurrentUserComment={canCurrentUserComment}
              canReply={false}
              isReplying={false}
              replyDraft=""
              onReplyDraftChange={() => undefined}
              onReplyToggle={() => undefined}
              onReplySubmit={() => undefined}
              onReport={() => onReport(reply.id)}
              isSubmitting={isSubmitting}
              isReporting={isReporting}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CommentCard({
  comment,
  viewer: _viewer,
  projectOwnerId,
  canCurrentUserComment,
  canReply,
  isReplying,
  replyDraft,
  onReplyDraftChange,
  onReplyToggle,
  onReplySubmit,
  onReport,
  isSubmitting,
  isReporting,
}: {
  comment: ProjectComment
  viewer: CommunityViewer
  projectOwnerId: string
  canCurrentUserComment: boolean
  canReply: boolean
  isReplying: boolean
  replyDraft: string
  onReplyDraftChange: (value: string) => void
  onReplyToggle: () => void
  onReplySubmit: () => void
  onReport: () => void
  isSubmitting: boolean
  isReporting: boolean
}) {
  const displayName = comment.displayName || comment.username || 'Anonymous'
  const isAuthor = comment.userId === projectOwnerId

  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-white">
        {comment.avatarUrl ? (
          <img
            src={comment.avatarUrl}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          displayName.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="text-sm font-medium text-white">{displayName}</span>
          {isAuthor ? (
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
              Author
            </span>
          ) : null}
          <span>@{comment.username || 'member'}</span>
          <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          {comment.isEdited ? <span>(edited)</span> : null}
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
          {comment.body}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {canReply && canCurrentUserComment ? (
            <button
              type="button"
              onClick={onReplyToggle}
              className="inline-flex items-center gap-1 text-zinc-500 transition-colors hover:text-white"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
          ) : null}

          <button
            type="button"
            onClick={onReport}
            disabled={comment.flaggedByViewer || isReporting}
            className="inline-flex items-center gap-1 text-zinc-500 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:text-zinc-700"
          >
            <Flag className="h-3.5 w-3.5" />
            {comment.flaggedByViewer ? 'Reported' : 'Report'}
          </button>

          {comment.replyCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-zinc-600">
              <MessageCircle className="h-3.5 w-3.5" />
              {comment.replyCount} repl{comment.replyCount === 1 ? 'y' : 'ies'}
            </span>
          ) : null}
        </div>

        {canReply && isReplying ? (
          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <Textarea
              value={replyDraft}
              onChange={(event) => onReplyDraftChange(event.target.value)}
              placeholder={`Reply to ${displayName}...`}
              maxLength={2000}
              className="min-h-[96px]"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onReplyToggle}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onReplySubmit}
                disabled={isSubmitting || replyDraft.trim().length === 0}
              >
                Reply
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
