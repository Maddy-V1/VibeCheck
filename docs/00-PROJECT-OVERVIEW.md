# [Platform Name TBA] — Project Overview

> **Read this file first. Every agent working on this project must understand this document before touching any code.**

---

## What We Are Building

A professional web platform where **vibe coders** (developers who build with AI tools like Cursor, Bolt, v0, Lovable) can:

1. Submit their projects for expert evaluation
2. Receive a structured score and review
3. Earn verifiable badges and certificates
4. Build a public portfolio that proves their skills

This is the **credibility layer** that vibe coders currently don't have. GitHub rewards traditional code quality. LinkedIn doesn't understand AI-native development. We fill that gap.

---

## The User in One Sentence

A person who built something real using AI tools and wants recognition for it — but has nowhere credible to show it.

---

## Core User Flow

```
Sign Up → Private Dashboard → Submit Project → Queue → Evaluation → Score Reveal → Public Profile → Community
```

- Dashboard is **private** until first evaluated project
- Profile **auto-unlocks** after first evaluation completes
- Community participation requires at least 1 evaluated project
- Weekly Top 10 and Monthly Top 50 rankings are editor-selected by admins from evaluated projects
- Profile rating is a **Phase 2 incomplete feature** and will ship later as a **5-star rating** plus a **single hashtag-style note tag**

---

## Platform Phases (Scope for This Build)

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 0 | Foundation setup — infra, auth, DB, design system | Complete |
| Phase 1 | Core MVP — submit, queue, evaluate, reveal, public profile | Complete |
| Phase 2 | Community, rankings, certificates, profile rating, integrations | In progress |
| Phase 3 | Paid queue, community evaluation, scale hardening | After user feedback |

**Current state: Phase 0 and Phase 1 are complete. Phase 2 is actively in progress.**

---

## Tech Stack — Final, Non-Negotiable

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) + TypeScript strict | SSR, API Routes = no separate backend |
| Database | Supabase (PostgreSQL) | RLS, Realtime, Storage, Auth |
| Auth | Supabase Auth + OAuth | Google, GitHub, LinkedIn |
| UI Library | shadcn/ui + Tailwind CSS | Full control, accessible by default |
| Animations | Framer Motion | Score reveals, transitions |
| Forms | React Hook Form + Zod | Type-safe validation |
| Data Fetching | TanStack Query | Caching, background refetch |
| Email | Resend + React Email | Transactional emails |
| File Uploads | Uploadthing | Videos, images — Next.js native |
| Certificate Gen | Satori + Sharp + PDFKit | Server-side, auto-generated |
| Analytics | Posthog | Free tier, privacy-friendly |
| Hosting | Vercel | Zero-config Next.js |
| Payments | Stripe | Deferred to Phase 3 |

**No Express. No separate Node.js server. Next.js API Routes handle all backend logic.**

---

## Quality Standard — This Is Non-Negotiable

This platform is vibe coded but must look and feel like a $500K funded product.

- Zero default shadcn components — every component must be customized
- No generic error messages — every state has intentional copy
- Skeleton loaders, not spinners
- Designed empty states for every list/feed
- Mobile responsive from 375px (even though web-only)
- Lighthouse score > 90 on all public pages
- TypeScript strict — no `any`, no ignored errors
- Supabase RLS policies on every table — manually reviewed

---

## File Structure Convention

```
/app
  /(auth)         — Sign in, Sign up pages
  /(dashboard)    — Private user dashboard
  /(public)       — Public profiles, project pages, community
  /(admin)        — Evaluator dashboard (team only)
  /api            — API Route Handlers
/components
  /ui             — shadcn base components
  /features       — Feature-specific components
  /layouts        — Page layout wrappers
/lib
  /supabase       — Supabase client, server, middleware
  /validations    — Zod schemas
  /utils          — Helper functions
  /types          — TypeScript types and interfaces
/emails           — React Email templates
/certificates     — Satori certificate templates
```

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth Providers (configured in Supabase dashboard)
# GitHub, Google, LinkedIn OAuth apps

# Resend
RESEND_API_KEY=

# Uploadthing
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Stripe (deferred - set up but don't activate)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## Agents Working on This Project

Each agent has a dedicated MD file. Read only your file + this overview file.

| File | Scope |
|------|-------|
| `01-DATABASE-SCHEMA.md` | Supabase tables, RLS, types |
| `02-AUTH-FLOW.md` | Sign up, sign in, OAuth, session |
| `03-USER-DASHBOARD.md` | Private dashboard, locked/unlocked states |
| `04-PROJECT-SUBMISSION.md` | Submission form, validation, queue entry |
| `05-QUEUE-SYSTEM.md` | Queue logic, realtime position updates |
| `06-EVALUATOR-DASHBOARD.md` | Internal team evaluation tool |
| `07-EVALUATION-REVEAL.md` | Score page, badge generation, notification |
| `08-PUBLIC-PROFILE.md` | Public profile page, project showcase |
| `09-CERTIFICATE-SYSTEM.md` | Auto-generation, PDF, shareable links |
| `10-COMMUNITY.md` | Feed, comments, reactions, moderation |
| `11-INTEGRATIONS.md` | GitHub + LinkedIn OAuth data pull |
| `12-EMAIL-SYSTEM.md` | Transactional emails via Resend |
| `13-DESIGN-SYSTEM.md` | Tokens, components, patterns — read before any UI work |
