# 03 — User Dashboard

> Agent scope: Private dashboard — locked state, unlocked state, project list, queue tracker, notifications.
> Read `00-PROJECT-OVERVIEW.md` and `13-DESIGN-SYSTEM.md` first.

---

## Dashboard States

The dashboard has two distinct states based on whether the user has any evaluated projects.

### State A — Locked (0 evaluated projects)

User has signed up but not yet had a project evaluated.

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR                │  MAIN                             │
│                         │                                   │
│  [Avatar] [Username]    │  ┌─────────────────────────────┐  │
│                         │  │  👋 Welcome, [Name]          │  │
│  ──────────────────     │  │                             │  │
│  Dashboard         ←    │  │  Your profile is locked     │  │
│  My Projects            │  │  until your first project   │  │
│  Community (locked)     │  │  is evaluated.              │  │
│  Settings               │  │                             │  │
│                         │  │  [Submit Your First Project]│  │
│                         │  └─────────────────────────────┘  │
│                         │                                   │
│                         │  ┌─────────────────────────────┐  │
│                         │  │  [Blurred preview of what   │  │
│                         │  │   a public profile looks    │  │
│                         │  │   like — greyed out]        │  │
│                         │  │                             │  │
│                         │  │  🔒 Unlock by getting       │  │
│                         │  │     evaluated               │  │
│                         │  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Blurred preview:** Show a real-looking (fake) profile underneath a blur + lock overlay. This creates desire — the user can see what they're working toward.

**If user has submitted but not yet evaluated:**
Show a queue tracker widget instead of the "Submit your first project" CTA:

```
┌───────────────────────────────────┐
│  [Project Title] is in the queue  │
│                                   │
│  Position:   #47                  │
│  Est:        ~7 days              │
│                                   │
│  [████████░░░░░░░] 60% to front  │
│                                   │
│  We'll notify you when it's done. │
└───────────────────────────────────┘
```

### State B — Unlocked (1+ evaluated projects)

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR                │  MAIN                             │
│                         │                                   │
│  [Avatar] [Username]    │  Overview cards row               │
│  [Public Profile Link]  │  [Projects] [Avg Score] [Badges]  │
│                         │                                   │
│  ──────────────────     │  ─────────────────────────────── │
│  Dashboard              │                                   │
│  My Projects            │  My Projects                      │
│  Community              │  [Card] [Card] [Card]             │
│  Settings               │  + Submit New Project             │
│                         │                                   │
│  ──────────────────     │  ─────────────────────────────── │
│  [View Public Profile]  │                                   │
│                         │  Notifications                    │
│                         │  [List]                           │
│                         │  Weekly Top 10 / Monthly Top 50   │
└─────────────────────────────────────────────────────────────┘
```

---

## Components to Build

### `DashboardLayout`
```typescript
// app/(dashboard)/layout.tsx
// Server component — fetches current profile server-side
// Renders sidebar + main content area
// Passes profile down via context or as prop
```

### `Sidebar`
```
- Platform logo (top)
- Nav links (Dashboard, My Projects, Community, Settings)
- Community link: locked with tooltip if no evaluated projects
- Bottom: Avatar, username, plan badge (Free / Priority)
- "View Public Profile" link — only shows when is_profile_public = true
```

### `ProjectCard` (dashboard version)

Shows inside "My Projects" grid.

```
┌─────────────────────────────────┐
│  [Status badge]  [Tier badge]   │
│                                 │
│  Project Title                  │
│  Short description...           │
│                                 │
│  Score: ●●●●●○  84/100         │  ← only if evaluated
│                                 │
│  [View Result] [Share Badge]   │  ← only if evaluated
│  [In Queue — #47]              │  ← only if in_queue
│  [Draft — Complete & Submit]   │  ← only if draft
└─────────────────────────────────┘
```

Status badge colors:
- `draft` → gray
- `submitted` / `in_queue` → brand purple
- `evaluating` → amber/yellow
- `evaluated` → green
- `rejected` → red

### `QueueTracker`

Real-time component — subscribes to Supabase Realtime on the `queue` table.

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function QueueTracker({ projectId, initialPosition }) {
  const [position, setPosition] = useState(initialPosition)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`queue:${projectId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'queue',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        setPosition(payload.new.position)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  return (
    <div className="rounded-card border border-surface-border bg-surface-card p-6">
      <p className="text-xs text-text-secondary uppercase tracking-widest mb-4">Queue Position</p>
      <div className="text-5xl font-display font-bold text-brand mb-1">#{position}</div>
      <p className="text-sm text-text-secondary">We'll notify you when evaluation begins.</p>
    </div>
  )
}
```

### `NotificationsPanel`

```
- Bell icon in sidebar/topbar with unread count badge
- Dropdown or slide-in panel showing last 10 notifications
- Mark all read button
- Notification types:
    - evaluation_complete → green dot, links to result page
    - queue_update → blue dot
    - profile_unlocked → purple dot, links to public profile
    - level_changed → gold dot
```

---

## Data Fetching

```typescript
// app/(dashboard)/dashboard/page.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth-helpers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/sign-in')
  if (!profile.onboarding_done) redirect('/dashboard/onboarding')

  const supabase = createServerComponentClient()

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      evaluations(score_total, tier_confirmed, evaluated_at),
      queue(position, estimated_days)
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const isUnlocked = projects?.some(p => p.status === 'evaluated') ?? false

  return isUnlocked
    ? <UnlockedDashboard profile={profile} projects={projects} notifications={notifications} />
    : <LockedDashboard profile={profile} projects={projects} />
}
```

---

## Overview Stats Row (unlocked state)

Three stat cards at top of main content:

| Card | Value | Detail |
|------|-------|--------|
| Projects Evaluated | COUNT of evaluated projects | "X projects reviewed" |
| Average Score | Mean of all score_totals | "Across all tiers" |
| Badges Earned | COUNT of badges | "Shareable credentials" |

### Leaderboard Modules

- Show **Weekly Top 10** and **Monthly Top 50** modules on the dashboard
- These lists are selected by admins from evaluated projects
- They are read-only for regular users
- They should appear on both locked and unlocked dashboard states

### Profile Rating Status

- **Do not treat profile rating as complete in the current build**
- Final Phase 2 direction:
  - rating out of **5**
  - displayed as **5 stars**
  - includes one short **hashtag-style note tag**
- Until that feature is built, keep dashboard UI neutral or show a simple "coming in Phase 2" placeholder

---

## Empty States

| State | Message | CTA |
|-------|---------|-----|
| No projects at all | "Your first project is one step away." | "Submit a Project" |
| All drafts, nothing submitted | "Finish your submission to join the queue." | "Complete Submission" |
| Has submitted, none evaluated | "Sit tight — your project is in the queue." | Show queue tracker |
| No notifications | "No notifications yet. We'll let you know when something happens." | None |
