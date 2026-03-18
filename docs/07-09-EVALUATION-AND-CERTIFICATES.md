# 07 — Evaluation Reveal & 09 — Certificate System

> Agent scope: Score reveal page, badge generation, certificate auto-generation, shareable links.
> Read `00-PROJECT-OVERVIEW.md`, `01-DATABASE-SCHEMA.md`, `13-DESIGN-SYSTEM.md` first.

---

## Evaluation Reveal Flow

When evaluation is complete:
1. Evaluator marks evaluation as done in admin dashboard
2. API route fires: update project status → `evaluated`, project `is_public` → `true`
3. Certificate/badge generation triggered (async, background)
4. Notification created in DB
5. Email sent via Resend
6. User opens `/dashboard/projects/[id]/result` → animated reveal

---

## Score Reveal Page — `/dashboard/projects/[id]/result`

This is the most emotional moment on the platform. Design it like an achievement unlock.

### Page Structure

```
Phase 1: Entry animation (0–0.5s)
  - Dark background, logo fades in
  - "Your results are in" fades up

Phase 2: Score reveal (0.5–2s)
  - Large score ring animates from 0 to actual score
  - Number counts up inside ring
  - Tier badge fades in below

Phase 3: Breakdown (2–3s)
  - Category scores slide in one by one
  - Each with its own mini bar filling up

Phase 4: Reviewer note (3–3.5s)
  - Card fades in with reviewer's note
  - Evaluator avatar/name shown

Phase 5: Badge + CTA (3.5s+)
  - Badge preview shown
  - Share buttons appear
  - "View Public Profile" CTA
```

### Component: Score Reveal

```tsx
// components/features/evaluation/ScoreReveal.tsx
'use client'
import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

const categoryConfig = [
  { key: 'score_functionality', label: 'Functionality & Problem Solving', max: 25, color: '#6C47FF' },
  { key: 'score_ux', label: 'UX & Design Quality', max: 20, color: '#00E5FF' },
  { key: 'score_complexity', label: 'Technical Complexity', max: 20, color: '#00B0FF' },
  { key: 'score_deployment', label: 'Deployment & Liveness', max: 10, color: '#00F5A0' },
  { key: 'score_code_quality', label: 'Code & Prompt Quality', max: 10, color: '#FBBF24' },
  { key: 'score_documentation', label: 'Documentation', max: 8, color: '#FF6584' },
  { key: 'score_originality', label: 'Originality & Creativity', max: 7, color: '#A78BFA' },
]

export function ScoreReveal({ evaluation, project }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
      
      {/* Phase 1: Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p className="text-text-secondary text-sm uppercase tracking-widest mb-2">Evaluation Complete</p>
        <h1 className="text-3xl font-display font-bold text-text-primary">{project.title}</h1>
      </motion.div>

      {/* Phase 2: Main Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <ScoreRing score={evaluation.score_total} size={160} />
      </motion.div>

      {/* Phase 3: Category Breakdown */}
      <div className="w-full max-w-lg space-y-3 mb-8">
        {categoryConfig.map((cat, i) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 + i * 0.1 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs text-text-secondary w-48 flex-shrink-0">{cat.label}</span>
            <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(evaluation[cat.key] / cat.max) * 100}%` }}
                transition={{ delay: 1.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-bold text-text-primary w-8 text-right">
              {evaluation[cat.key]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Phase 4: Reviewer Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8 }}
        className="w-full max-w-lg rounded-card border border-surface-border bg-surface-card p-6 mb-8"
      >
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Reviewer Note</p>
        <p className="text-text-primary leading-relaxed italic">"{evaluation.reviewer_note}"</p>
      </motion.div>

      {/* Phase 5: Badge + CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
        className="flex flex-col items-center gap-4"
      >
        <BadgePreview project={project} evaluation={evaluation} />
        <div className="flex gap-3">
          <ShareBadgeButton projectId={project.id} />
          <Button asChild><a href={`/u/${project.profiles.username}`}>View Public Profile</a></Button>
        </div>
      </motion.div>

    </div>
  )
}
```

---

## Certificate Generation System

### Stack
- **Satori** — React JSX → SVG (server-side, no browser)
- **Sharp** — SVG → high-res PNG
- **PDFKit** — PNG → downloadable PDF
- **Supabase Storage** — permanent CDN-backed storage

### API Route: Generate Certificate

```typescript
// app/api/certificates/generate/route.ts
import satori from 'satori'
import sharp from 'sharp'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { CertificateTemplate } from '@/certificates/CertificateTemplate'
import { BadgeTemplate } from '@/certificates/BadgeTemplate'
import { computeCertificateLevel } from '@/lib/utils/certificate'

export async function POST(request: Request) {
  // This route is called server-side only, authenticated via service role
  const { project_id, evaluation_id, user_id } = await request.json()
  
  const supabase = createServiceClient()

  // Fetch all required data
  const [{ data: profile }, { data: evaluation }, { data: project }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user_id).single(),
    supabase.from('evaluations').select('*').eq('id', evaluation_id).single(),
    supabase.from('projects').select('*').eq('id', project_id).single(),
  ])

  // 1. Generate Project Badge
  const badgeSvg = await satori(
    BadgeTemplate({ project, evaluation, profile }),
    { width: 800, height: 400, fonts: [/* load Inter font */] }
  )
  const badgePng = await sharp(Buffer.from(badgeSvg)).png().toBuffer()
  
  const { data: badgeUpload } = await supabase.storage
    .from('badges')
    .upload(`${user_id}/${project_id}/badge.png`, badgePng, {
      contentType: 'image/png',
      upsert: true,
    })

  // Get public URL
  const { data: { publicUrl: badgeUrl } } = supabase.storage
    .from('badges')
    .getPublicUrl(`${user_id}/${project_id}/badge.png`)

  // 2. Create badge record
  const { data: badge } = await supabase.from('badges').insert({
    user_id,
    project_id,
    type: 'project_badge',
    tier: evaluation.tier_confirmed,
    score: evaluation.score_total,
    certificate_url: badgeUrl,
    shareable_link: `/badge/${project_id}`,
  }).select().single()

  // 3. Profile rating is a separate Phase 2 feature
  // Do not treat the old /100 public rating model as final

  return NextResponse.json({ badge_url: badgeUrl, badge_id: badge.id })
}
```

### Profile Rating Status

```typescript
// Profile rating is not complete in the current build.
// Final Phase 2 direction:
// - rating out of 5
// - displayed as a 5-star rating
// - includes one short hashtag-style note tag
// - unlocks after 3+ evaluated projects
```

---

## Certificate Templates (Satori React Components)

```typescript
// certificates/BadgeTemplate.tsx
// This is a React component that Satori converts to SVG
// Use only inline styles — no Tailwind classes (Satori doesn't support them)

export function BadgeTemplate({ project, evaluation, profile }) {
  return (
    <div style={{
      display: 'flex', width: 800, height: 400,
      background: '#0D0D1A', borderRadius: 12,
      border: '1px solid #2D2D4E', fontFamily: 'Inter',
    }}>
      {/* Left accent bar */}
      <div style={{ width: 8, background: '#6C47FF', borderRadius: '12px 0 0 12px' }} />
      
      {/* Content */}
      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#A78BFA', fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>PROJECT BADGE</p>
            <h2 style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{project.title}</h2>
            <TierChip tier={evaluation.tier_confirmed} />
          </div>
          <ScoreCircle score={evaluation.score_total} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <p style={{ color: '#94A3B8', fontSize: 11 }}>
            Evaluated by [Platform Name]  •  {new Date(evaluation.evaluated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <p style={{ color: '#2D2D4E', fontSize: 10 }}>ID: {evaluation.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Shareable Links & Verification

| URL | What it does |
|-----|-------------|
| `/badge/[project_id]` | Public badge page — shows project badge, score, reviewer note |
| `/verify/[cert_id]` | Certificate verification — confirms cert is real and valid |
| `/u/[username]` | Full public profile with all evaluated projects |

**Verification page** (`/verify/[cert_id]`):
- Fetches badge by `verification_id`
- Shows: Name, rating, level, project count, issue date
- Big green "✓ Verified" if `is_valid = true`
- "This certificate could not be verified" if not found

---

## Email Triggers

| Event | Email |
|-------|-------|
| Evaluation complete | "Your [project] has been evaluated — see your score" |
| Profile rating unlocked | Deferred until the redesigned Phase 2 rating system ships |
| Certificate level change | Deferred until the redesigned Phase 2 rating system ships |

See `12-EMAIL-SYSTEM.md` for email templates.
