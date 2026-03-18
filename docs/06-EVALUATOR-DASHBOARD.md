# 06 — Evaluator Dashboard (Internal Tool)

> Agent scope: Internal team evaluation tool. Not user-facing. Evaluators score projects.
> Read `00-PROJECT-OVERVIEW.md` and `01-DATABASE-SCHEMA.md` first.

---

## Who Uses This

- **5 Senior Evaluators** — final sign-off, write reviewer note
- **10 Associate Evaluators** — initial scoring, flag tier mismatches
- URL: `/admin/*` — protected by role check

---

## Role System

```typescript
// No separate roles table needed for Phase 1
// Store evaluator status directly in profiles

// Add column to profiles:
is_evaluator boolean DEFAULT false,
evaluator_role text CHECK (evaluator_role IN ('associate', 'senior'))  -- null for regular users
```

Middleware check:
```typescript
// In /admin layout — server component
const profile = await getCurrentProfile()
if (!profile?.is_evaluator) redirect('/dashboard')
```

---

## Pages

### `/admin` — Admin Operations Hub

The current admin dashboard is split into operational sections instead of a single queue-only screen:

- **Project Queue** — pick up and process submissions
- **Top 10 Weekly** — select this week's standout evaluated projects
- **Top 50 Monthly** — select this month's standout evaluated projects
- **Profile Rating** — monitor future Phase 2 profile rating status and sync needs

#### Project Queue

Live queue list. Evaluators pick projects from here.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Evaluation Queue                   Total: 47  │  My Active: 2      │
├────┬──────────────────────┬────────┬───────┬──────┬────────────────┤
│ #  │ Project              │ Tier   │ Plan  │ User │ Action         │
├────┼──────────────────────┼────────┼───────┼──────┼────────────────┤
│ 1  │ My SaaS App          │ Tier 2 │ ⚡PRI │ @jd  │ [Pick Up]      │
│ 2  │ AI Writing Tool      │ Tier 3 │ ⚡PRI │ @mk  │ [Pick Up]      │
│ 3  │ Todo App             │ Tier 1 │ FREE  │ @ra  │ [Pick Up]      │
└────┴──────────────────────┴────────┴───────┴──────┴────────────────┘
```

- "Pick Up" assigns the project to the evaluator and opens the scoring form
- Evaluators can only have 3 active evaluations at once (prevent hoarding)
- Senior evaluators see all — associates see unassigned only

#### Weekly Top 10 / Monthly Top 50

- Admins select these lists from already evaluated projects
- Weekly list is capped at **10**
- Monthly list is capped at **50**
- These published lists appear on the home page and dashboard

#### Profile Rating

- This is a **Phase 2 incomplete feature**
- Final direction:
  - **5-star rating**
  - **one hashtag-style note tag**
  - unlocks after **3+ evaluated projects**
- Admin dashboard may show status, sync readiness, or placeholders, but should not treat the old `/100 + level badge` model as final

### `/admin/evaluate/[projectId]` — Scoring Form

The main evaluation interface.

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Queue                                                │
│                                                                 │
│  Project: [Title]          User: @username        Tier: Tier 2  │
│  Live URL: [link]          GitHub: [link]          Video: [link] │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  SCORING                                                        │
│                                                                 │
│  Functionality & Problem Solving              [__] / 25        │
│  UX & Design Quality                          [__] / 20        │
│  Technical Complexity (relative to tier)      [__] / 20        │
│  Deployment & Liveness                        [__] / 10        │
│  Code & Prompt Quality                        [__] / 10        │
│  Documentation & Presentation                 [__] / 8         │
│  Originality & Creativity                     [__] / 7         │
│                                                                 │
│  Total: [auto-calculated]  / 100                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Tier Confirmation   ○ Tier 1  ● Tier 2  ○ Tier 3              │
│  (Change if project was miscategorized)                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Reviewer Note (shown to user — max 500 chars)                  │
│  [                                                  ]           │
│  [   textarea — write 2-3 sentences of real feedback]           │
│                                                                 │
│  Internal Notes (team only — not shown to user)                 │
│  [                                                  ]           │
│                                                                 │
│  [Save Draft]                    [Submit Evaluation]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scoring Validation

```typescript
// lib/validations/evaluation.ts
import { z } from 'zod'

export const evaluationSchema = z.object({
  project_id: z.string().uuid(),
  tier_confirmed: z.enum(['tier1', 'tier2', 'tier3']),
  score_functionality: z.number().min(0).max(25),
  score_ux: z.number().min(0).max(20),
  score_complexity: z.number().min(0).max(20),
  score_deployment: z.number().min(0).max(10),
  score_code_quality: z.number().min(0).max(10),
  score_documentation: z.number().min(0).max(8),
  score_originality: z.number().min(0).max(7),
  reviewer_note: z.string().min(50, 'Write at least 50 chars — users deserve real feedback').max(500),
  internal_notes: z.string().optional(),
}).refine(data => {
  const total = data.score_functionality + data.score_ux + data.score_complexity +
    data.score_deployment + data.score_code_quality + data.score_documentation + data.score_originality
  return total <= 100
}, { message: 'Total score cannot exceed 100' })
```

---

## API Route: Submit Evaluation

```typescript
// app/api/admin/evaluations/submit/route.ts
export async function POST(request: Request) {
  const supabase = createServiceClient() // service role — bypasses RLS
  const evaluator = await getCurrentProfile()
  if (!evaluator?.is_evaluator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = evaluationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = parsed

  // Calculate total
  const score_total = data.score_functionality + data.score_ux + data.score_complexity +
    data.score_deployment + data.score_code_quality + data.score_documentation + data.score_originality

  // Insert evaluation
  const { data: evaluation } = await supabase.from('evaluations').insert({
    ...data, score_total, evaluator_id: evaluator.id,
  }).select().single()

  // Update project
  await supabase.from('projects').update({
    status: 'evaluated',
    is_public: true,
    evaluation_id: evaluation.id,
  }).eq('id', data.project_id)

  // Get project owner
  const { data: project } = await supabase
    .from('projects').select('user_id, title').eq('id', data.project_id).single()

  // Remove from queue
  await supabase.from('queue').delete().eq('project_id', data.project_id)

  // Create notification
  await supabase.from('notifications').insert({
    user_id: project.user_id,
    type: 'evaluation_complete',
    title: 'Your project has been evaluated!',
    body: `${project.title} scored ${score_total}/100. See your full results.`,
    link: `/dashboard/projects/${data.project_id}/result`,
  })

  // Trigger certificate generation (async)
  // POST to /api/certificates/generate — don't await, fire and forget
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/certificates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: data.project_id,
      evaluation_id: evaluation.id,
      user_id: project.user_id,
    }),
  })

  // Send email (async)
  // See 12-EMAIL-SYSTEM.md

  return NextResponse.json({ evaluation })
}
```

---

## `/admin/projects` — All Projects View

For senior evaluators. Filter by status, tier, score range.

## `/admin/users` — User Management

For senior evaluators. View profiles, community status, moderation actions.
See `10-COMMUNITY.md` for moderation detail.
