# Engagement System - Complete Summary

## Overview

The platform now has a **unified engagement system** that works for both **community posts** AND **projects**. This includes reactions, comments, and auto-updated engagement metrics.

---

## Database Changes

### New Tables

1. **`reactions`** - Unified reactions for posts & projects
   - Columns: `id`, `user_id`, `community_post_id`, `project_id`, `reaction_type`, `created_at`
   - Constraint: Exactly one of `community_post_id` or `project_id` must be set
   - One reaction per user per item

2. **`comments`** - Unified comments for posts & projects
   - Columns: `id`, `user_id`, `community_post_id`, `project_id`, `parent_comment_id`, `body`, `status`, `is_edited`, `edited_at`, `reaction_count`, `reply_count`, `created_at`, `updated_at`
   - Constraint: Exactly one of `community_post_id` or `project_id` must be set
   - Supports 1 level of nesting (replies to top-level comments only)

3. **`comment_reactions`** - Reactions on comments
   - Columns: `id`, `comment_id`, `user_id`, `reaction_type`, `created_at`
   - One reaction per user per comment

4. **`comment_flags`** - User reports on comments
   - Columns: `id`, `comment_id`, `user_id`, `reason`, `details`, `created_at`
   - Auto-flags comment after 3+ unique reports

### Updated Tables

1. **`community_posts`** - Added columns:
   - `reaction_count` (integer, default 0) - Auto-updated by triggers
   - `comment_count` (integer, default 0) - Auto-updated by triggers

2. **`projects`** - Added columns:
   - `reaction_count` (integer, default 0) - Auto-updated by triggers
   - `comment_count` (integer, default 0) - Auto-updated by triggers

### New Enums

1. **`reaction_type`**: `'like' | 'helpful' | 'insightful' | 'fire' | 'celebrate'`
2. **`comment_status`**: `'visible' | 'flagged' | 'hidden' | 'removed'`

---

## Auto-Update Triggers

All count columns are automatically maintained by database triggers:

| Trigger | Updates | When |
|---------|---------|------|
| `trigger_update_community_post_reaction_count` | `community_posts.reaction_count` | Reaction added/removed |
| `trigger_update_project_reaction_count` | `projects.reaction_count` | Reaction added/removed |
| `trigger_update_community_post_comment_count` | `community_posts.comment_count` | Comment added/removed |
| `trigger_update_project_comment_count` | `projects.comment_count` | Comment added/removed |
| `trigger_update_comment_reaction_count` | `comments.reaction_count` | Comment reaction added/removed |
| `trigger_update_comment_reply_count` | `comments.reply_count` | Reply added/removed |
| `trigger_mark_comment_edited` | `comments.is_edited`, `comments.edited_at` | Comment body updated |
| `trigger_auto_flag_comment` | `comments.status` | 3+ flags received |

---

## Helper Functions

### Reactions

```sql
-- React to community post
SELECT toggle_community_post_reaction(
  'post-uuid',
  'user-uuid',
  'like'::reaction_type
);

-- React to project
SELECT toggle_project_reaction(
  'project-uuid',
  'user-uuid',
  'fire'::reaction_type
);

-- React to comment
SELECT toggle_comment_reaction(
  'comment-uuid',
  'user-uuid',
  'helpful'::reaction_type
);
```

### Comments

```sql
-- Add comment to community post
SELECT add_community_post_comment(
  'post-uuid',
  'user-uuid',
  'Great post!',
  NULL  -- parent_comment_id (NULL for top-level)
);

-- Add comment to project
SELECT add_project_comment(
  'project-uuid',
  'user-uuid',
  'Amazing work!',
  NULL
);

-- Reply to a comment
SELECT add_project_comment(
  'project-uuid',
  'user-uuid',
  'Thanks!',
  'parent-comment-uuid'
);

-- Edit comment (within 15 minutes)
SELECT edit_comment(
  'comment-uuid',
  'user-uuid',
  'Updated text'
);

-- Delete comment (soft delete)
SELECT delete_comment(
  'comment-uuid',
  'user-uuid'
);

-- Flag comment
SELECT flag_comment(
  'comment-uuid',
  'user-uuid',
  'spam',
  'This is promotional spam'
);

-- Moderate comment (admin only)
SELECT moderate_comment(
  'comment-uuid',
  'admin-uuid',
  'removed'::comment_status
);
```

---

## Views

### `community_posts_with_engagement`
Community posts with engagement metrics and user info.

```sql
SELECT * FROM community_posts_with_engagement
ORDER BY engagement_score DESC
LIMIT 20;
```

### `projects_with_engagement`
Projects with engagement metrics and user info.

```sql
SELECT * FROM projects_with_engagement
ORDER BY engagement_score DESC
LIMIT 20;
```

### `comments_detailed`
Comments with user info and flag counts.

```sql
SELECT * FROM comments_detailed
WHERE project_id = 'project-uuid'
  AND parent_comment_id IS NULL
ORDER BY created_at DESC;
```

---

## TypeScript Types

```typescript
import type { Database } from './database.types'

export type Reaction = Database['public']['Tables']['reactions']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentReaction = Database['public']['Tables']['comment_reactions']['Row']
export type CommentFlag = Database['public']['Tables']['comment_flags']['Row']

export type ReactionType = 'like' | 'helpful' | 'insightful' | 'fire' | 'celebrate'
export type CommentStatus = 'visible' | 'flagged' | 'hidden' | 'removed'
```

---

## Client-Side Usage Examples

### React to a Post

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

async function reactToPost(postId: string, reactionType: ReactionType) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return
  
  const { data, error } = await supabase.rpc('toggle_community_post_reaction', {
    p_post_id: postId,
    p_user_id: user.id,
    p_reaction: reactionType
  })
  
  // Refetch post to get updated count
  const { data: post } = await supabase
    .from('community_posts')
    .select('reaction_count')
    .eq('id', postId)
    .single()
    
  return post
}
```

### Add Comment

```typescript
async function addComment(projectId: string, body: string, parentId?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return
  
  const { data, error } = await supabase.rpc('add_project_comment', {
    p_project_id: projectId,
    p_user_id: user.id,
    p_body: body,
    p_parent_comment_id: parentId || null
  })
  
  return data
}
```

### Get Comments with Replies

```typescript
async function getProjectComments(projectId: string) {
  const supabase = createClient()
  
  // Get top-level comments
  const { data: topLevelComments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles(username, display_name, avatar_url)
    `)
    .eq('project_id', projectId)
    .is('parent_comment_id', null)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
  
  // Get replies for each top-level comment
  for (const comment of topLevelComments || []) {
    const { data: replies } = await supabase
      .from('comments')
      .select(`
        *,
        profiles(username, display_name, avatar_url)
      `)
      .eq('parent_comment_id', comment.id)
      .eq('status', 'visible')
      .order('created_at', { ascending: true })
    
    comment.replies = replies
  }
  
  return topLevelComments
}
```

### Get Reaction Breakdown

```typescript
async function getReactionBreakdown(projectId: string) {
  const supabase = createClient()
  
  const { data: reactions } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('project_id', projectId)
  
  const breakdown = reactions?.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
    return acc
  }, {} as Record<ReactionType, number>)
  
  return breakdown
}
```

---

## Access Rules

| Action | Requirement |
|--------|-------------|
| View reactions | Anyone |
| Add reaction | Authenticated user |
| View comments | Anyone (visible comments only) |
| Add comment | Authenticated + 1+ evaluated project + active community status |
| Edit comment | Own comment + within 15 minutes |
| Delete comment | Own comment |
| Flag comment | Authenticated user |
| Moderate comment | Evaluator role |

---

## Features

✅ **Unified System** - Same tables for posts & projects  
✅ **Auto-Counts** - Triggers maintain all counts automatically  
✅ **5 Reaction Types** - like, helpful, insightful, fire, celebrate  
✅ **Threaded Comments** - 1 level deep (replies to top-level only)  
✅ **15-Minute Edit Window** - Users can edit recent comments  
✅ **Soft Delete** - Comments marked as deleted, not removed  
✅ **Auto-Flagging** - 3+ reports auto-flags comment  
✅ **Comment Reactions** - React to individual comments  
✅ **Full RLS** - Row-level security on all tables  
✅ **Optimized Indexes** - Fast queries for engagement sorting  

---

## Migration Files

1. **`schema.sql`** - Base schema (run first)
2. **`02_soft_delete_and_reactions.sql`** - Soft delete for profiles/projects
3. **`04_complete_engagement_system.sql`** - Complete engagement system (run after schema.sql)

Run in order:
```bash
# 1. Run base schema
psql -f supabase/schema.sql

# 2. Run soft delete (optional)
psql -f supabase/02_soft_delete_and_reactions.sql

# 3. Run engagement system
psql -f supabase/04_complete_engagement_system.sql
```

---

## Documentation Updated

- ✅ `docs/01-DATABASE-SCHEMA.md` - Added all new tables, enums, and types
- ✅ `docs/10-COMMUNITY.md` - Added engagement system overview and examples
- ✅ `docs/08-PUBLIC-PROFILE.md` - Added engagement metrics to project cards
- ✅ `docs/ENGAGEMENT-SYSTEM-SUMMARY.md` - This file (complete reference)

---

## Next Steps

1. Generate TypeScript types: `npx supabase gen types typescript`
2. Create React components for reactions and comments
3. Add real-time subscriptions for live updates
4. Implement notification system for new comments/reactions
5. Add email notifications for engagement events
