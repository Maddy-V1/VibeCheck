# 08 — Public Profile

> Agent scope: Public-facing user profile page, project showcase, and future profile rating surface.
> Read `00-PROJECT-OVERVIEW.md` and `13-DESIGN-SYSTEM.md` first.

---

## URL Structure

```
/u/[username]                    — User profile
/u/[username]/projects/[slug]    — Individual project page
/badge/[projectId]               — Standalone badge page
/verify/[certId]                 — Certificate verification
```

---

## Profile Page — `/u/[username]`

### Access Rules

| Profile state | Who can see it |
|--------------|----------------|
| `is_profile_public = false` | Nobody except the user themselves (redirects to 404 for others) |
| `is_profile_public = true` | Anyone — fully public, no login required |

### Page Layout

```
┌────────────────────────────────────────────────────────────┐
│  HEADER — full width, dark background                          │
│                                                                │
│  [Avatar 80px]  [Display Name]          [Phase 2 Rating Slot]  │
│                 @username               [Tag / Stars later]    │
│                 [Bio text]                                      │
│                                                                │
│                 [GitHub] [LinkedIn] [Website]                  │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  PROJECTS GRID — 3 col desktop, 2 col tablet, 1 col mobile    │
│                                                                │
│  [Project Card] [Project Card] [Project Card]                  │
│  [Project Card] [Project Card]                                 │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  RECENT ACTIVITY (LinkedIn-style)                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [COMMENT] on Project Title →                              │  │
│  │  "Comment body text here..."                              │  │
│  │  2 hours ago                                              │  │
│  └────────────────────────────────────────────────────────┘  │
│  ...more comments                                              │
│                                                                │
└────────────────────────────────────────────────────────────┘
```

**Recent Activity section:**
- Component: `components/features/profile/PublicUserComments.tsx`
- Shows up to 10 of the user's recent top-level comments across all projects
- Each card links to the project's comments section (`/badge/[id]#comments`)
- Displays: `[COMMENT]` tag, project title, comment body (line-clamp-3), relative timestamp
- Fetched via service client (bypasses RLS) with `comments` joined to `projects(title)`
- Only visible comments (`status = 'visible'`), top-level only (`parent_comment_id IS NULL`)

---

## Profile Header Component

```tsx
// components/features/profile/ProfileHeader.tsx

export function ProfileHeader({ profile, evaluatedProjectCount, badges }) {
  const hasProfileRating = false // Phase 2, not live yet

  return (
    <div className="bg-surface-card border-b border-surface-border">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          
          {/* Left: Identity */}
          <div className="flex items-start gap-5">
            <img
              src={profile.avatar_url ?? '/default-avatar.png'}
              alt={profile.display_name}
              className="w-20 h-20 rounded-full border-2 border-surface-border"
            />
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">
                {profile.display_name}
              </h1>
              <p className="text-text-secondary text-sm mb-2">@{profile.username}</p>
              {profile.bio && (
                <p className="text-text-secondary text-sm max-w-md leading-relaxed">
                  {profile.bio}
                </p>
              )}
              <div className="flex gap-3 mt-3">
                {profile.github_username && (
                  <a href={`https://github.com/${profile.github_username}`}
                    className="text-text-secondary hover:text-brand text-sm flex items-center gap-1">
                    <GithubIcon size={14} /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url}
                    className="text-text-secondary hover:text-brand text-sm flex items-center gap-1">
                    <LinkedinIcon size={14} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Future Phase 2 rating slot */}
          {hasProfileRating && (
            <div className="flex-shrink-0 text-right">
              <StarRating value={4.6} />
              <div className="text-xs text-text-secondary mb-2">Profile Rating</div>
              <ProfileTag>#polished</ProfileTag>
              <p className="text-xs text-text-secondary mt-1">
                {evaluatedProjectCount} projects evaluated
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
```

### Phase 2 Rating Direction

```tsx
// Profile rating is a Phase 2 incomplete feature.
// Final direction:
// - 5-star rating
// - unlocks after 3+ evaluated projects
// - one short hashtag-style note tag
// Example: ★★★★☆ + #sharp
```

Current public profile work should not assume the old `/100 + certificate level` model is final.

---

## Project Card (public version)

```tsx
export function PublicProjectCard({ project, evaluation }) {
  return (
    <a href={`/u/${project.profiles.username}/projects/${project.slug}`}
      className="rounded-card border border-surface-border bg-surface-card p-5 hover:border-brand/50 hover:-translate-y-0.5 transition-all block">
      
      <div className="flex items-start justify-between mb-3">
        <TierBadge tier={evaluation.tier_confirmed} />
        <ScoreChip score={evaluation.score_total} />
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-1">{project.title}</h3>
      <p className="text-sm text-text-secondary line-clamp-2 mb-4">{project.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.tech_stack?.slice(0, 4).map(tech => (
          <span key={tech} className="px-2 py-0.5 rounded-full bg-surface-elevated text-xs text-text-secondary">
            {tech}
          </span>
        ))}
      </div>

      {/* Engagement metrics */}
      <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
        <span className="flex items-center gap-1">
          <HeartIcon size={14} /> {project.reaction_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageIcon size={14} /> {project.comment_count}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <a href={project.live_url} target="_blank" onClick={e => e.stopPropagation()}
          className="text-xs text-brand hover:underline flex items-center gap-1">
          <ExternalLinkIcon size={10} /> Live Project
        </a>
        <span className="text-xs text-text-muted">
          {formatDistanceToNow(new Date(evaluation.evaluated_at))} ago
        </span>
      </div>
    </a>
  )
}
```

---

## Standalone Badge Page — `/badge/[projectId]`

Public project detail page with full evaluation results, comments, and related projects.

**Route:** `app/badge/[projectId]/page.tsx`

```
┌────────────────────────────────────────────────────────┐
│  ← Back to Home                                           │
│                                                          │
│  [Two Column Layout]                                     │
│                                                          │
│  LEFT COLUMN (2/3)           │  RIGHT COLUMN (1/3)       │
│  ────────────────────────  │  ─────────────────────  │
│  [Title + TierBadgeImage]    │  PublicResultsPanel       │
│  [Status badges]             │  (Score breakdown,        │
│  [Description]               │   7 categories,           │
│  by @username                │   reviewer note)          │
│                              │                           │
│  [Live] [GitHub] [Demo]     │                           │
│                              │                           │
│  Tech Stack                  │                           │
│  [tag] [tag] [tag]           │                           │
│                              │                           │
│  Project Details              │                           │
│  Submitted / Evaluated dates │                           │
│                              │                           │
│  ────────────────────────  │                           │
│  Comments (Preview Mode)     │                           │
│  [Comment 1]                 │                           │
│  [Comment 2]                 │                           │
│  [See all X comments]       │                           │
│                              │                           │
│  ────────────────────────  │                           │
│  FROM THE COMMUNITY          │                           │
│  More evaluated projects     │                           │
│  [Card] [Card] [Card]       │                           │
│  [Card] [Card] [Card]       │                           │
└────────────────────────────────────────────────────────┘
```

### Comments Preview Mode

**Component:** `components/features/community/project-comments.tsx`

The `ProjectComments` component accepts a `previewMode` prop:
- When `previewMode = true`: Only the first 2 top-level comments are shown
- A "See all X comments" button expands to show all comments
- The comment input form is hidden in preview mode
- Clicking "See all" sets `showAll = true` (client-side toggle)

### Related Projects Section

**Component:** `components/features/community/related-projects.tsx`

Shows up to 6 other evaluated public projects, **excluding** the current project.

```
┌────────────────────────────────────────────────────────┐
│  FROM THE COMMUNITY                                        │
│  More evaluated projects                                   │
│                                                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ [ScoreRing] │ │ [ScoreRing] │ │ [ScoreRing] │  │
│  │ [Tier]      │ │ [Tier]      │ │ [Tier]      │  │
│  │ Title       │ │ Title       │ │ Title       │  │
│  │ desc...     │ │ desc...     │ │ desc...     │  │
│  │ [tags]      │ │ [tags]      │ │ [tags]      │  │
│  │ @user 💬 5  │ │ @user 💬 3  │ │ @user 💬 8  │  │
│  └────────────┘ └────────────┘ └────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Each card includes:**
- Score ring (conic-gradient with hue-adaptive coloring)
- Tier badge with `TierBadgeImage`
- Title, description (line-clamp-2)
- Tech stack pills (max 3 + overflow counter)
- Author avatar + @username
- Comment count
- Live URL icon (if available)
- Hover: lift + border brighten

---

## Certificate Verification — `/verify/[certId]`

```
┌──────────────────────────────────────┐
│         ✓ Certificate Verified       │  ← green if valid
│                                      │
│  [Platform Name] confirms:           │
│                                      │
│  [Display Name]                      │
│  has a valid public credential:      │
│                                      │
│  Project Badge — Tier 2              │
│                                      │
│  Score: 84 / 100                     │
│  Evaluated: March 2026               │
│  Issued: March 2026                  │
│  Certificate ID: XXXX-XXXX           │
│                                      │
│  [View Full Profile]                 │
└──────────────────────────────────────┘
```

---

## Server-Side Data Fetching

```typescript
// app/(public)/u/[username]/page.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }) {
  // For SEO — dynamic meta tags
  const profile = await getPublicProfile(params.username)
  if (!profile) return { title: 'Profile Not Found' }
  return {
    title: `${profile.display_name} — Vibe Coder`,
    description: profile.bio ?? `${profile.display_name}'s vibe coding portfolio`,
    openGraph: { images: [profile.avatar_url] }
  }
}

export default async function ProfilePage({ params }) {
  const supabase = createServerComponentClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .eq('is_profile_public', true)
    .single()

  if (!profile) notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select(`*, evaluations(*)`)
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .eq('status', 'evaluated')
    .order('created_at', { ascending: false })

  const { data: profileCert } = await supabase
    .from('badges')
    .select('*')
    .eq('user_id', profile.id)
    .eq('type', 'profile_certificate')
    .eq('is_valid', true)
    .single()

  return <ProfilePageUI profile={profile} projects={projects ?? []} certificate={profileCert} />
}
```
