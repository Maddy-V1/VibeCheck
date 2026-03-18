# 04 — Project Submission

> Agent scope: Submission form, validation, tier selection, queue entry.
> Read `00-PROJECT-OVERVIEW.md`, `01-DATABASE-SCHEMA.md`, `13-DESIGN-SYSTEM.md` first.

---

## User Flow

```
Dashboard → "Submit a Project" CTA
  → Multi-step form (3 steps)
    → Step 1: Basics (title, description, tier)
    → Step 2: Links (live URL, GitHub, demo video)
    → Step 3: Tech stack + confirm
  → Submission → Queue entry created
  → Confirmation screen with queue number
  → Redirect to dashboard (project shows as "In Queue")
```

---

## Form: 3 Steps

### Step 1 — Project Basics

| Field | Type | Rules |
|-------|------|-------|
| Project Title | text input | Required, max 100 chars |
| Description | textarea | Required, 50–1000 chars. "What does it do and why did you build it?" |
| Tier | radio card selection | Required. Show examples for each tier |

**Tier Selection UI — 3 clickable cards, not a dropdown:**

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  🟢 TIER 1      │  │  🔵 TIER 2      │  │  🟣 TIER 3      │
│  Foundational   │  │  Builder        │  │  Architect      │
│                 │  │                 │  │                 │
│ To-do apps      │  │ Full-stack apps │  │ AI tools        │
│ Landing pages   │  │ Auth systems    │  │ Dev platforms   │
│ Basic CRUD      │  │ API integ.      │  │ Open source     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Include a helper: "Not sure? Pick the one that feels right — our evaluator may adjust it."

### Step 2 — Links

| Field | Type | Rules |
|-------|------|-------|
| Live URL | url input | Required. Must be a valid URL. Accessibility check: show warning if URL returns error |
| GitHub URL | url input | Optional. Must be github.com domain if provided |
| Demo Video | file upload OR url | Optional. Video file via Uploadthing OR YouTube/Loom URL |

**Live URL validation:** When user blurs the field, ping the URL client-side and warn if unreachable:
```
"We couldn't reach this URL. Make sure it's publicly accessible before submitting."
```
This is a warning, not a blocking error — some URLs have CORS restrictions.

### Step 3 — Tech Stack + Confirm

| Field | Type | Rules |
|-------|------|-------|
| Tech stack | multi-select tag input | Optional but encouraged. Common options pre-loaded. Free-text allowed. |
| Confirm checklist | checkboxes | Must check all 3 before submitting |

**Confirm checklist:**
- [ ] My project is live and publicly accessible
- [ ] I built this project (with or without AI tools)
- [ ] I have read and agree to the evaluation guidelines

---

## Zod Validation Schema

```typescript
// lib/validations/project.ts
import { z } from 'zod'

export const projectSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(50, 'Tell us more — at least 50 characters').max(1000),
  tier: z.enum(['tier1', 'tier2', 'tier3'], { required_error: 'Select a tier' }),
  live_url: z.string().url('Enter a valid URL including https://'),
  github_url: z.string().url().refine(
    url => url.includes('github.com'),
    'Must be a GitHub URL'
  ).optional().or(z.literal('')),
  demo_video_url: z.string().url().optional().or(z.literal('')),
  tech_stack: z.array(z.string()).optional().default([]),
  confirmed_live: z.literal(true, { errorMap: () => ({ message: 'Confirm your project is live' }) }),
  confirmed_own: z.literal(true, { errorMap: () => ({ message: 'Confirm this is your project' }) }),
  confirmed_guidelines: z.literal(true, { errorMap: () => ({ message: 'Agree to the guidelines' }) }),
})

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>
```

---

## API Route: Submit Project

```typescript
// app/api/projects/submit/route.ts
import { createServerComponentClient } from '@/lib/supabase/server'
import { projectSubmissionSchema } from '@/lib/validations/project'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/utils/slug'

export async function POST(request: Request) {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = projectSubmissionSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { confirmed_live, confirmed_own, confirmed_guidelines, ...projectData } = parsed.data

  // Generate unique slug
  const slug = await generateSlug(projectData.title, supabase)

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      slug,
      user_id: user.id,
      status: 'in_queue',
      queue_entered_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (projectError) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }

  // Add to queue
  const { error: queueError } = await supabase
    .from('queue')
    .insert({
      project_id: project.id,
      user_id: user.id,
      plan: 'free', // Default — Phase 3 will check user.plan
    })

  if (queueError) {
    // Rollback project if queue fails
    await supabase.from('projects').delete().eq('id', project.id)
    return NextResponse.json({ error: 'Failed to add to queue' }, { status: 500 })
  }

  // Get queue position
  const { data: queueEntry } = await supabase
    .from('queue')
    .select('position, estimated_days')
    .eq('project_id', project.id)
    .single()

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'project_submitted',
    title: 'Project submitted!',
    body: `${project.title} is now #${queueEntry?.position} in the evaluation queue.`,
    link: `/dashboard/projects/${project.id}`,
  })

  return NextResponse.json({
    project,
    queue_position: queueEntry?.position,
    estimated_days: queueEntry?.estimated_days,
  })
}
```

---

## Confirmation Screen

After successful submission, show a full-screen confirmation (not a toast):

```
┌────────────────────────────────────┐
│          ✓ (animated check)        │
│                                    │
│    You're in the queue!            │
│                                    │
│    [Project Title]                 │
│    Tier 2 — Builder                │
│                                    │
│    ┌──────────────────────────┐    │
│    │  Queue Position          │    │
│    │         #47              │    │
│    │  Estimated: ~7 days      │    │
│    └──────────────────────────┘    │
│                                    │
│  We'll notify you by email and     │
│  in-app when your evaluation is    │
│  ready.                            │
│                                    │
│  [View My Dashboard]               │
└────────────────────────────────────┘
```

Queue number should animate counting up to the actual number (Framer Motion count-up).
