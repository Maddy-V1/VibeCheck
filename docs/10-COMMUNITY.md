# 10 — Community

> Agent scope: Community feed, project browsing, comments, reactions, moderation.
> Read `00-PROJECT-OVERVIEW.md` and `01-DATABASE-SCHEMA.md` first.

---

## Access Rules

| Action | Requirement |
|--------|-------------|
| Browse community feed | Any signed-up user (even without evaluated project) |
| View public profiles | Anyone (no login required) |
| React to posts/projects | Must be signed in |
| Comment on posts/projects | Must have 1+ evaluated project + community_status = 'active' |
| Report content | Must be signed in |

---

## Engagement System Overview

The platform uses a **unified engagement system** for both community posts AND projects:

- **Reactions**: 5 types (like, helpful, insightful, fire, celebrate)
- **Comments**: Threaded (1 level deep - replies to top-level comments only)
- **Auto-counts**: reaction_count and comment_count auto-updated via triggers
- **Moderation**: Auto-flagging after 3+ reports

---

## Pages

### `/community` — Main Feed

```
┌───────────────────────────────────────────────────────────────┐
│  COMMUNITY                                                    │
│                                                               │
│  [Filter: All Tiers ▼] [Filter: Sort: Recent ▼] [Search]    │
│                                                               │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  [Project Card] — evaluated projects, sorted by recent       │
│  [Project Card]                                              │
│  [Project Card]                                              │
│  ...infinite scroll                                           │
│                                                               │
│  Sidebar:                                                     │
│  - Top Scored This Week                                       │
│  - Recently Evaluated                                         │
│  - Filter by Tier                                             │
│  - Filter by Tech Stack                                       │
└───────────────────────────────────────────────────────────────┘
```

**Community feed shows:** All evaluated + public projects, sorted by `evaluated_at DESC` by default.

**Filters:**
- Tier: All / Tier 1 / Tier 2 / Tier 3
- Sort: Recent / Highest Scored / Most Commented
- Tech Stack: multi-select (React, Next.js, Supabase, etc.)

---

## Community Project Card

Same as public profile project card but includes:
- Reaction count with breakdown (like, fire, etc.)
- Comment count
- Author avatar + username link
- Time since evaluation

```tsx
export function CommunityProjectCard({ project, evaluation }) {
  return (
    <a href={`/u/${project.profiles.username}/projects/${project.slug}`}>
      <div className="rounded-card border border-surface-border bg-surface-card p-5">
        
        <div className="flex items-start justify-between mb-3">
          <TierBadge tier={evaluation.tier_confirmed} />
          <ScoreChip score={evaluation.score_total} />
        </div>

        <h3 className="text-base font-semibold text-text-primary mb-1">{project.title}</h3>
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">{project.description}</p>

        {/* Engagement metrics */}
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
          <span className="flex items-center gap-1">
            <HeartIcon size={14} /> {project.reaction_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageIcon size={14} /> {project.comment_count}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <img src={project.profiles.avatar_url} className="w-6 h-6 rounded-full" />
          <span className="text-xs text-text-secondary">
            by @{project.profiles.username}
          </span>
        </div>
      </div>
    </a>
  )
}
```

---

## Reactions System

### React to Community Post

```typescript
// Client component
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PostReactions({ postId, initialCount, userReaction }) {
  const [count, setCount] = useState(initialCount)
  const [reaction, setReaction] = useState(userReaction)
  const supabase = createClient()

  async function toggleReaction(type: 'like' | 'fire' | 'helpful') {
    const { data, error } = await supabase.rpc('toggle_community_post_reaction', {
      p_post_id: postId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_reaction: type
    })

    if (!error) {
      // Refetch counts
      const { data: post } = await supabase
        .from('community_posts')
        .select('reaction_count')
        .eq('id', postId)
        .single()
      
      setCount(post.reaction_count)
      setReaction(data ? type : null)
    }
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => toggleReaction('like')} 
        className={reaction === 'like' ? 'text-brand' : 'text-text-secondary'}>
        👍 {count}
      </button>
      <button onClick={() => toggleReaction('fire')}>
        🔥
      </button>
      <button onClick={() => toggleReaction('helpful')}>
        💡
      </button>
    </div>
  )
}
```

### React to Project

```typescript
// Same pattern, use toggle_project_reaction instead
const { data, error } = await supabase.rpc('toggle_project_reaction', {
  p_project_id: projectId,
  p_user_id: userId,
  p_reaction: 'fire'
})
```

---

## Comments System

### Comment Component

```tsx
export function Comment({ comment, currentUser, onReply }) {
  const canInteract = currentUser?.hasEvaluatedProject && currentUser?.community_status === 'active'

  return (
    <div className="flex gap-3">
      <img src={comment.avatar_url} className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <a href={`/u/${comment.username}`} className="text-sm font-semibold text-text-primary hover:text-brand">
            {comment.display_name}
          </a>
          <span className="text-xs text-text-muted">
            {formatDistanceToNow(new Date(comment.created_at))} ago
          </span>
          {comment.is_edited && (
            <span className="text-xs text-text-muted">(edited)</span>
          )}
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{comment.body}</p>
        
        {/* Comment reactions */}
        <div className="flex gap-3 mt-2 items-center">
          <CommentReactions commentId={comment.id} count={comment.reaction_count} />
          {canInteract && (
            <button onClick={() => onReply(comment.id)}
              className="text-xs text-text-muted hover:text-brand">
              Reply ({comment.reply_count})
            </button>
          )}
          <ReportButton commentId={comment.id} />
        </div>

        {/* Replies */}
        {comment.replies?.map(reply => (
          <Comment key={reply.id} comment={reply} currentUser={currentUser} onReply={() => {}} />
        ))}
      </div>
    </div>
  )
}
```

### Add Comment

```typescript
// Add comment to community post
const { data, error } = await supabase.rpc('add_community_post_comment', {
  p_post_id: postId,
  p_user_id: userId,
  p_body: 'Great post!',
  p_parent_comment_id: null // or parent comment UUID for replies
})

// Add comment to project
const { data, error } = await supabase.rpc('add_project_comment', {
  p_project_id: projectId,
  p_user_id: userId,
  p_body: 'Amazing work!',
  p_parent_comment_id: null
})
```

### Edit Comment (within 15 minutes)

```typescript
const { data, error } = await supabase.rpc('edit_comment', {
  p_comment_id: commentId,
  p_user_id: userId,
  p_new_body: 'Updated comment text'
})
```

### Delete Comment

```typescript
const { data, error } = await supabase.rpc('delete_comment', {
  p_comment_id: commentId,
  p_user_id: userId
})
```

---

## Comments System

Comments live on individual project pages. Threaded — one level of replies only (no infinite nesting).

### Comment Component

```tsx
// components/features/community/Comment.tsx

export function Comment({ post, currentUser, onReply }) {
  const canInteract = currentUser?.hasEvaluatedProject && currentUser?.community_status === 'active'

  return (
    <div className="flex gap-3">
      <img src={post.profiles.avatar_url} className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <a href={`/u/${post.profiles.username}`} className="text-sm font-semibold text-text-primary hover:text-brand">
            {post.profiles.display_name}
          </a>
          <span className="text-xs text-text-muted">
            {formatDistanceToNow(new Date(post.created_at))} ago
          </span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{post.body}</p>
        <div className="flex gap-3 mt-2">
          {canInteract && (
            <button onClick={() => onReply(post.id)}
              className="text-xs text-text-muted hover:text-brand">
              Reply
            </button>
          )}
          <ReportButton postId={post.id} />
        </div>

        {/* Replies */}
        {post.replies?.map(reply => (
          <Comment key={reply.id} post={reply} currentUser={currentUser} onReply={() => {}} />
        ))}
      </div>
    </div>
  )
}
```

### Comment Form

```tsx
export function CommentForm({ projectId, parentId = null, onSuccess }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  async function submit() {
    if (body.trim().length < 3) {
      setError('Write something meaningful.')
      return
    }
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, parent_id: parentId, body }),
    })
    if (res.ok) {
      setBody('')
      onSuccess()
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Share your thoughts on this project..."}
        maxLength={2000}
        className="w-full bg-surface-card border border-surface-border rounded-card p-3 text-sm text-text-primary resize-none focus:border-brand focus:outline-none"
        rows={3}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-muted">{body.length}/2000</span>
        <Button onClick={submit} size="sm">Post</Button>
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  )
}
```

---

## API Routes

### POST `/api/community/posts`

```typescript
export async function POST(request: Request) {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check eligibility
  const { data: profile } = await supabase
    .from('profiles').select('community_status').eq('id', user.id).single()

  const { data: hasEvaluated } = await supabase
    .from('projects').select('id').eq('user_id', user.id).eq('status', 'evaluated').limit(1)

  if (!hasEvaluated?.length || profile?.community_status !== 'active') {
    return NextResponse.json({ error: 'Not eligible to post' }, { status: 403 })
  }

  const { project_id, parent_id, body } = await request.json()

  if (!body?.trim() || body.length > 2000) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
  }

  // Validate parent_id if replying (must be top-level post, not a reply)
  if (parent_id) {
    const { data: parent } = await supabase
      .from('community_posts').select('parent_id').eq('id', parent_id).single()
    if (parent?.parent_id) {
      return NextResponse.json({ error: 'Cannot reply to a reply' }, { status: 400 })
    }
  }

  const { data: post, error } = await supabase
    .from('community_posts')
    .insert({ user_id: user.id, project_id, parent_id, body: body.trim() })
    .select('*, profiles(username, display_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to post' }, { status: 500 })
  return NextResponse.json({ post })
}
```

### DELETE `/api/community/posts/[id]`

Users can delete own posts. Admins can delete any post.

---

## Moderation

### Moderation Actions

| Action | Effect | Who Can Do It |
|--------|--------|--------------|
| Warning | Notification to user, logged | Senior evaluators |
| Suspension | `community_status = 'suspended'`, `suspension_until = date` | Senior evaluators |
| Ban | `community_status = 'banned'` permanently | Senior evaluators |
| Reinstatement | Restore to `active` | Senior evaluators |

### Report Flow

1. User clicks "Report" on any post
2. Modal: select reason (spam, harassment, inappropriate, other)
3. POST `/api/community/report` — creates flag on the post
4. Post's `moderation_status` → `'flagged'`
5. Evaluator team reviews flagged posts in `/admin/moderation`

### Admin Moderation Dashboard — `/admin/moderation`

```
┌──────────────────────────────────────────────────────────────────┐
│  Moderation Queue                           Flagged: 3           │
├───────────────────────┬───────────┬──────────┬──────────────────┤
│ Post                  │ Author    │ Reason   │ Action           │
├───────────────────────┼───────────┼──────────┼──────────────────┤
│ "That's garbage..."   │ @user123  │ Harass.  │ [Warn][Sus][Ban] │
│ "Buy my course..."    │ @spammer  │ Spam     │ [Remove][Ban]    │
└───────────────────────┴───────────┴──────────┴──────────────────┘
```

### Moderation API Route

```typescript
// POST /api/admin/moderate
// Body: { user_id, action: 'warning'|'suspension'|'ban'|'reinstatement', reason, duration_days? }

export async function POST(request: Request) {
  const supabase = createServiceClient()
  const actioner = await getCurrentProfile()
  if (!actioner?.is_evaluator || actioner.evaluator_role !== 'senior') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { user_id, action, reason, duration_days } = await request.json()

  let newStatus: string
  let suspension_until = null

  switch (action) {
    case 'warning':     newStatus = 'warned'; break
    case 'suspension':
      newStatus = 'suspended'
      suspension_until = new Date(Date.now() + (duration_days ?? 7) * 86400000).toISOString()
      break
    case 'ban':         newStatus = 'banned'; break
    case 'reinstatement': newStatus = 'active'; break
    default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  await supabase.from('profiles').update({
    community_status: newStatus,
    suspension_until,
  }).eq('id', user_id)

  await supabase.from('moderation_log').insert({
    user_id, actioned_by: actioner.id, action, reason, duration_days,
  })

  // Notify user
  await supabase.from('notifications').insert({
    user_id,
    type: 'moderation_action',
    title: `Community ${action}`,
    body: reason,
  })

  return NextResponse.json({ success: true })
}
```

---

## Suspended/Banned User Experience

- Suspended: Can browse but cannot post. Banner shown: "Your community access is suspended until [date]."
- Banned: Can browse but cannot post. Banner: "Your community access has been permanently suspended."
- Profile and projects remain public — we don't delete credentialed work over moderation
