# 03 — User Dashboard

> Agent scope: Private dashboard — locked state, unlocked state, project list, queue tracker, notifications, settings activity.
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
│  [Avatar] [Username]    │  Glass stat cards row              │
│  [Public Profile Link]  │  [Projects] [Avg Score]           │
│                         │  [Profile Rating] [Badges]        │
│  ──────────────────     │  (colored icon backgrounds,       │
│  Dashboard              │   hover shadow transitions)       │
│  My Projects            │                                   │
│  Notifications (•)      │  ─────────────────────────────── │
│  Community              │                                   │
│  Settings               │  Weekly Top 10 / Monthly Top 50   │
│                         │  (leaderboard grid, 2 columns)    │
│  ──────────────────     │                                   │
│  [View Public Profile]  │  ─────────────────────────────── │
│                         │                                   │
│                         │  Recent Projects                  │
│                         │  [Premium Card] [Card] [Card]     │
│                         │  (gradient header accent,         │
│                         │   score rings, lift-on-hover)     │
│                         │                                   │
│                         │  ─────────────────────────────── │
│                         │                                   │
│                         │  Notifications (mini timeline)    │
│                         │  [Timeline spine + 5 items]       │
│                         │  "View all →" link                │
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

### `ProjectCard` (dashboard version — premium redesign)

Shows inside "My Projects" grid on both the dashboard and `/dashboard/projects`.

```
┌─────────────────────────────────────────┐
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  (gradient accent)  │  ← 4px colored bar per status
│  [Status badge] [Tier img]  [ScoreRing] │  ← conic-gradient score ring
│                                         │
│  Project Title                          │
│  Short description...                   │
│                                         │
│  ┌─── Evaluated ──────────────────────┐ │
│  │  ✓ Score: 84/100  ▮▮▮▮▯            │ │  ← progress bar + 5-segment dots
│  │  ████████████████░░░░ (84%)        │ │  ← animated gradient fill bar
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─── In Queue ───────────────────────┐ │
│  │  ● Queue #3 · ~5d                  │ │  ← pulse dot animation
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─── Draft ──────────────────────────┐ │
│  │  📄 Draft — Complete & Submit →    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  [🔗] [GitHub] [▶]         Jan 15, 2026│  ← icon-boxed links
└─────────────────────────────────────────┘
```

**Design details:**
- Top gradient accent bar color matches project status
- Score ring: conic-gradient with hue-adaptive coloring (red < 40, amber < 70, green ≥ 70)
- Cards lift on hover (`-translate-y-1`, deep shadow)
- Queue items use an animated pulse dot
- Link icons wrapped in small rounded-md boxes

**Status → gradient accent colors:**
- `draft` → `#71717a` (zinc)
- `submitted` / `in_queue` → `#818cf8` (indigo)
- `evaluating` → `#fbbf24` (amber)
- `evaluated` → `#34d399` (emerald)
- `rejected` → `#f87171` (red)

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

### `NotificationsPanel` (inline on dashboard)

```
- Mini timeline spine (vertical gradient line) on the dashboard
- Shows last 5 notifications inline
- Each notification has a color-coded icon node on the timeline
- "View all →" link to /dashboard/notifications
- Unread count badge (pill) next to section header
```

### `/dashboard/notifications` — Dedicated Notifications Page (Timeline UI)

**Route:** `app/(dashboard)/dashboard/notifications/page.tsx`
**Component:** `components/features/dashboard/notifications-list.tsx`

Full-page timeline view of all notifications, grouped by date.

```
┌──────────────────────────────────────────────────────┐
│  Notifications                                       │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │  ● 3 unread notifications  [Mark all read]       ││  ← ping animation
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  TODAY ───────────────────────────────────────────   │
│  │                                                   │
│  ●── [✓ Evaluation Complete]   "Your project..."    │  ← emerald glow
│  │   2 hours ago                                     │
│  │                                                   │
│  ●── [🏆 Badge Earned]         "You've earned..."   │  ← amber glow
│  │   5 hours ago                                     │
│  │                                                   │
│  YESTERDAY ──────────────────────────────────────    │
│  │                                                   │
│  ●── [💬 New Comment]          "@user replied..."   │  ← sky glow
│  │   1 day ago                                       │
│  │                                                   │
│  THIS WEEK ──────────────────────────────────────    │
│  │                                                   │
│  ○── [📊 Queue Update]         "Position moved..."  │  ← indigo (read)
│     yesterday                                        │
└──────────────────────────────────────────────────────┘
```

**Timeline design details:**
- Vertical gradient spine: `from-white/[0.08] via-white/[0.05] to-transparent`
- Date group headers with horizontal gradient divider
- Color-coded icon nodes per notification type (6 types):
  - `evaluation_complete` → emerald
  - `badge_earned` → amber
  - `score_reveal` → violet
  - `comment` → sky
  - `reaction` → rose
  - default → indigo
- Unread items get a colored glow shadow + background tint
- Unread dot indicator next to the arrow
- Scale-on-hover micro-animation for timeline nodes
- Grouped by: Today, Yesterday, This Week, [Month Year]

---

### Settings Activity Panels

**Route:** `app/(dashboard)/dashboard/settings/page.tsx`
**Component:** `components/features/dashboard/settings/settings-activity.tsx`

The settings page now includes two activity sections between Account and Danger Zone:

```
┌──────────────────────────────────────────────────────┐
│  Your Reactions                                      │
│  15 reactions on community projects                  │
│                                                      │
│  👏  Project Title A                    2 hours ago  │
│  🔥  Project Title B                    1 day ago    │
│  👍  Project Title C                    3 days ago   │
│  ...                                                 │
│  and 12 more reactions                               │
├──────────────────────────────────────────────────────┤
│  Your Comments                                       │
│  8 comments on projects                              │
│                                                      │
│  ┌─ COMMENT ─ on Project Title A ────────────────┐  │
│  │  "This is a great implementation of..."        │  │
│  │  2 hours ago                                   │  │
│  └────────────────────────────────────────────────┘  │
│  ...                                                 │
└──────────────────────────────────────────────────────┘
```

**Data fetching:**
- Reactions: service client query on `reactions` joined with `projects(title)`, limit 50
- Comments: service client query on `comments` joined with `projects(title)`, limit 50
- Both filtered to `user_id = current user`

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
