# AGENT-PROMPT.md — How to Use These Files with Your AI IDE

> Read this before every coding session.
> This is your master briefing + every task-specific prompt, copy-paste ready.

---

## How This Works

These MD files are your agent's brain. Before writing any code, the agent reads:
1. `00-PROJECT-OVERVIEW.md` — always, every session
2. `13-DESIGN-SYSTEM.md` — for any UI work
3. The specific feature file for the current task

The agent then builds exactly what the spec describes — no guessing, no generic patterns.

---

## Master Prompt (Paste This at the Start of Every Session)

```
You are an expert senior full-stack engineer working on a professional web platform
for evaluating and showcasing vibe-coded projects.

IMPORTANT: Before writing any code, read these files in order:
1. @00-PROJECT-OVERVIEW.md
2. @13-DESIGN-SYSTEM.md
3. @[FEATURE-FILE].md  ← replace with the file for this task

TECH STACK (non-negotiable):
- Next.js 16, App Router, TypeScript strict mode
- Supabase: PostgreSQL, Auth, Storage, Realtime
- shadcn/ui + Tailwind CSS (custom tokens — see 13-DESIGN-SYSTEM.md)
- Framer Motion for animations
- React Hook Form + Zod for forms
- TanStack Query for client-side data fetching
- Resend + React Email for transactional emails
- Satori + Sharp for server-side certificate and badge generation
- Uploadthing for file uploads
- Posthog for analytics
- Vercel for hosting

QUALITY STANDARD — THIS IS NON-NEGOTIABLE:
This platform is vibe coded but must look and feel like a $500K funded product.
- Customize every shadcn component — nothing looks out-of-the-box
- Design every state: loading skeleton (not spinner), empty, error, success
- Write intentional copy for every message — never "Something went wrong"
- Mobile responsive from 375px width
- TypeScript strict — no `any`, no ts-ignore
- RLS policy on every Supabase table interaction
- No hardcoded colors — only design system tokens from tailwind.config.ts

SCALE:
Architected for 300,000 accounts. Built on free tiers during development.
Every decision must work at 300K with only a plan upgrade — no code rewrites.

YOUR TASK:
[DESCRIBE THE SPECIFIC TASK HERE]

OUTPUT FORMAT:
- Show the full file path before every file
- Write complete files — no placeholders, no "..." shortcuts
- Brief inline comment on any non-obvious decision
- If you write a Supabase query, also write the RLS policy that secures it
```

---

## PHASE 0 — Foundation

### Task 0.1 — Init Project

```
YOUR TASK:
Initialize the Next.js 16 project with full configuration:
- TypeScript strict mode (tsconfig: strict, noImplicitAny, exactOptionalPropertyTypes)
- Tailwind configured with all design tokens from 13-DESIGN-SYSTEM.md
- shadcn/ui initialized, dark mode as default, custom theme applied
- ESLint + Prettier + Husky pre-commit hooks
- Folder structure exactly as in 00-PROJECT-OVERVIEW.md
- .env.local.example with all variables from SETUP-GUIDE.md
- .gitignore including .env.local, .env
- Root layout.tsx with Inter + Cal Sans from Google Fonts
- Placeholder home page at / — platform name centered, dark background, no other content yet

Foundation only. No features.
```

### Task 0.2 — Supabase + Middleware

```
YOUR TASK:
Generate the complete Supabase setup from @01-DATABASE-SCHEMA.md:

1. A single SQL script to run in Supabase SQL Editor — creates all enums, tables,
   indexes, RLS policies, and triggers in dependency order (one paste, no errors)
2. lib/supabase/client.ts — browser client
3. lib/supabase/server.ts — server component client (uses cookies())
4. lib/supabase/service.ts — service role client (server-only, never client-side)
5. middleware.ts — session refresh on every request + protected route redirects
6. lib/types/database.types.ts — placeholder (will be replaced by supabase gen types)
7. lib/types/index.ts — all convenience TypeScript types from the schema file

The SQL script must be a single runnable block. Verify order: enums → tables → indexes → functions → triggers → RLS.
```

---

## PHASE 1 — Core MVP

### Task 1.1 — Auth Pages

```
YOUR TASK:
Build the complete authentication system from @02-AUTH-FLOW.md:

Pages:
- /sign-in — split layout. Left: animated brand panel (subtle gradient, platform name, tagline).
  Right: OAuth buttons (GitHub first, then Google, then LinkedIn), email/password below a divider.
- /sign-up — same layout. Add terms checkbox. After OAuth signup redirect to /dashboard/onboarding.
- /auth/callback — route handler that exchanges code for session, redirects to /dashboard
- /dashboard/onboarding — 4-step flow: confirm name, set username (uniqueness check), bio, guidelines.
  On complete: set onboarding_done = true, redirect to /dashboard.

Helpers:
- lib/supabase/auth-helpers.ts: getCurrentUser(), getCurrentProfile(), signOut()

All error states from 02-AUTH-FLOW.md must be handled — no raw Supabase errors shown.
The brand panel on the left should use a slow CSS animation — do not use a static image.
```

### Task 1.2 — Dashboard Shell + Projects List

```
YOUR TASK:
Build the full dashboard from @03-USER-DASHBOARD.md:

Layout:
- Sidebar (240px): logo, nav links, profile snippet, sign out. Collapses to bottom nav on mobile.
- Main content area: changes based on locked/unlocked state.

Locked state (is_profile_public = false AND no evaluated projects):
- Welcome message
- Frosted glass blurred preview card of what their profile will look like
- Single prominent CTA: "Submit Your First Project"

Unlocked state:
- 3 overview stat cards: Evaluated count, In Queue count, Avg Score
- Projects list with all status states (see 03-USER-DASHBOARD.md status table)
- Weekly Top 10 and Monthly Top 50 leaderboard modules
- Profile rating slot should be treated as a Phase 2 placeholder for now, not a finished live feature
- Notification bell → slide-in panel from right

All loading states: skeleton cards, not spinners.
All empty states: illustrated empty state with CTA, not blank space.

Also build /dashboard/settings with Profile, Account, and Danger Zone sections.
```

### Task 1.3 — Project Submission Form

```
YOUR TASK:
Build the project submission flow from @04-PROJECT-SUBMISSION.md:

Route: /dashboard/submit — 3-step form with animated progress indicator.

Step 1 — Basics:
- Title input (max 100 chars, char counter shown)
- Description textarea (50–1000 chars, char counter)
- Tier selection: 3 large clickable cards side by side (not a dropdown).
  Each card shows tier name, color-coded left border, and 4 example project types.
  Selected state: glowing border in tier color. Use tier colors from 13-DESIGN-SYSTEM.md.

Step 2 — Links:
- Live URL: text input. On blur, fetch the URL and warn (not block) if unreachable.
  Warning: "We couldn't reach this URL — make sure it's publicly accessible."
- GitHub URL: optional, validates github.com domain
- Demo Video: file upload (Uploadthing) OR paste a YouTube/Loom URL

Step 3 — Tech Stack + Confirm:
- Multi-select tag input with common presets + free text
- 3 confirmation checkboxes (all required)

API: POST /api/projects/submit — full implementation from 04-PROJECT-SUBMISSION.md.
Confirmation screen after submit: animated queue number count-up, estimated days, "We'll notify you" copy.

The tier cards are the most important UI on this form — spend extra effort on them.
```

### Task 1.4 — Queue System

```
YOUR TASK:
Build the queue system from @05-QUEUE-SYSTEM.md:

Components:
- QueuePositionBadge: shows "#12 in queue" with a live-updating number
- useQueuePosition hook: Supabase Realtime subscription to queue table
- ETA display: "Estimated ~7 days" based on position × average days per evaluation

Pages:
- /dashboard/projects/[id]: project detail page showing full submission info + queue widget
  If evaluated: show score summary + link to /dashboard/projects/[id]/result
  If in_queue or evaluating: show live queue position + ETA

Admin API:
- POST /api/admin/queue/assign: takes project_id + evaluator_id, sets status to evaluating,
  assigns queue entry, removes from queue on completion
```

### Task 1.5 — Evaluator Dashboard

```
YOUR TASK:
Build the internal evaluator tool from @06-EVALUATOR-DASHBOARD.md:

Route group: /admin — protected by is_evaluator = true on the profile.
Add is_evaluator boolean column to profiles table if not already present.
Add middleware check: /admin/* redirects to /dashboard if is_evaluator = false.

Pages:
- /admin — queue list. All in_queue projects ordered by position. Shows tier, submission date,
  tech stack, live URL. Click → opens project detail.
- /admin/projects/[id] — evaluation workspace:
  Left: iframe preview of the live URL + all submission metadata
  Right: scoring panel with 7 category inputs, real-time total calculation, tier confirmation,
         reviewer note textarea (50-500 chars, shown to user), internal notes (not shown to user)
  Submit button: validates all fields, creates evaluation record, triggers post-evaluation flow.

Post-evaluation API route: POST /api/admin/evaluations/submit
Actions on submit:
1. Insert evaluation record
2. Update project status → evaluated, is_public → true
3. Trigger certificate/badge generation (POST /api/certificates/generate)
4. Create in-app notification for user
5. Send evaluation complete email via Resend
6. Remove from queue
```

### Task 1.6 — Score Reveal + Badge Generation

```
YOUR TASK:
Build the score reveal experience and badge system from @07-09-EVALUATION-AND-CERTIFICATES.md:

Score Reveal Page: /dashboard/projects/[id]/result
- 5-phase animation sequence using Framer Motion (exact sequence in the spec)
- ScoreRing: SVG circle animates from 0 to score over 1.2s cubic-bezier(0.16, 1, 0.3, 1)
- Category breakdown: 7 bars slide in sequentially with 100ms stagger after score lands
- Reviewer note fades in as a card (quoted, italic)
- Badge preview + share buttons + "View Public Profile" CTA

Badge Generation:
- POST /api/certificates/generate — called server-side after evaluation
- BadgeTemplate: Satori React component (inline styles only — no Tailwind)
  800×400px, dark background, tier color accent bar on left, score circle top right
- Sharp converts SVG → PNG
- Upload to Supabase Storage bucket: badges/
- Save URL to badges table

Public Pages:
- /badge/[project_id]: public badge page — shows badge image + score breakdown + reviewer note
- /verify/[cert_id]: verification page — confirms badge is real, shows issue date and user
```

### Task 1.7 — Public Profile Page

```
YOUR TASK:
Build the public profile page from @08-PUBLIC-PROFILE.md:

Route: /u/[username] — Server Component, SSR, fully crawlable.

Layout:
- Header: avatar, display_name, @username, bio, GitHub link, LinkedIn link
- Do not assume profile rating is live yet. Leave room for a future Phase 2 profile module.
- Projects grid: 3 columns desktop, 1 column mobile. Each card shows:
  score ring, project title, tier badge, tech stack tags, "View Badge →" link
- Share button: copies /u/[username] to clipboard

SEO: full metadata export with og:title, og:description, og:image pointing to first project badge.

If is_profile_public = false: return a clean "This profile isn't public yet" page (not a 404).
If username doesn't exist: return proper 404 page.

This page is the main thing users share publicly. It must look exceptional.
```

---

## PHASE 2 — Community + Rankings + Certificates + Polish

### Task 2.1 — Community Feed

```
YOUR TASK:
Build the community system from @10-COMMUNITY.md:

Pages:
- /community — public-facing feed of recently evaluated projects
  Filter bar: tier (all/1/2/3), min score (any/60+/75+/90+), sort (newest/top scored)
  Project cards: score ring, title, tier badge, stack tags, evaluator note preview, "View →"
  Infinite scroll using TanStack Query + Supabase range queries

- /community is readable by anyone (no auth required to browse)
- Commenting and reacting requires: auth + at least 1 evaluated project + community_status = active

Comments:
- On /badge/[project_id] — threaded, 1 level deep (reply to top-level only)
- Community gate: if user has 0 evaluated projects, show "Submit a project to join the conversation"
- Each comment: avatar, username, timestamp, body, report button

Reactions:
- 3 reactions per project in feed: 👏 🔥 🤯
- Toggle on/off. Count shown. Auth required to react.

Moderation:
- Flag button on every comment → creates moderation_log entry
- Flagged content hidden from feed, visible to evaluator team in /admin
```

### Task 2.2 — Weekly + Monthly Rankings

```
YOUR TASK:
Build the leaderboard system for the current build:

- Weekly Top 10 and Monthly Top 50 are selected by admins from the pool of already evaluated projects
- Admin view must include separate sections for:
  - Project Queue
  - Weekly Top 10
  - Monthly Top 50
  - Profile Rating
- Home page and dashboard should show the published weekly and monthly ranking lists
- Ranking selections are period-based, not permanent flags on projects
- The ranking feature is live before profile rating
```

### Task 2.3 — Profile Rating (INCOMPLETE / FUTURE PHASE 2)

```
YOUR TASK:
When profile rating work is explicitly requested, treat the current implementation as incomplete and redesign it with this product spec:

- Rating is out of 5, shown as a 5-star rating
- Rating unlocks only after 3+ evaluated projects
- The profile also gets one short hashtag-style note tag (single phrase / one-word concept)
  Examples: #sharp, #creative, #reliable, #polished
- Do not use the old /100 public profile rating UI as the final product direction
- Do not treat certificate level badges as the final profile rating model
- This feature belongs to Phase 2 and is not complete yet
```

### Task 2.4 — Full Certificate System

```
YOUR TASK:
Build the complete profile certificate system from @07-09-EVALUATION-AND-CERTIFICATES.md:

Certificate Generation:
- ProfileCertificateTemplate: Satori component at 2480×1754px (A4 landscape, high-res)
  Design direction must follow the latest Phase 2 profile rating product spec when that work is active.
  Do not lock the product to the old `/100 + certificate level` public rating model.
  Inline styles only — no Tailwind.

- Profile certificate work is downstream of the redesigned Phase 2 profile rating system
- PDF generation: PDFKit wraps the certificate PNG into a downloadable PDF
- Level change notification: if level changes after recalculation, send email + in-app notification

Certificate Levels (defined in 07-09 spec):
- Architect (90-100): gold  
- Builder (75-89): purple
- Maker (60-74): cyan
- Foundational (40-59): green
- Provisional (0-39): gray

Pages:
- /dashboard/certificates: shows all earned badges + profile certificate
  Download PNG, Download PDF, Copy shareable link, Open verification page
  LinkedIn export button (pre-fills LinkedIn credential form with certificate URL)
```

### Task 2.5 — GitHub + LinkedIn Data Integration

```
YOUR TASK:
Build the OAuth data integrations from @11-INTEGRATIONS.md:

GitHub Integration (triggered after GitHub OAuth login):
- Fetch: username, avatar, bio, public repos, top languages (sorted by byte count), 
  total contributions this year, follower count
- Store in profiles.github_data (jsonb)
- On project submission form: pre-suggest tech stack tags from user's top GitHub languages

LinkedIn Integration (triggered after LinkedIn OAuth login):
- Fetch: first name, last name, headline, profile picture URL
- Store in profiles.linkedin_data (jsonb)
- On profile page: if bio is empty, show LinkedIn headline as placeholder

Dashboard "Connections" section in /dashboard/settings:
- GitHub: connected/not connected, last synced timestamp, Disconnect button
- LinkedIn: connected/not connected, Disconnect button (clears linkedin_data)
- Manual re-sync button for GitHub data

Disconnect: clears the relevant jsonb field, does not revoke OAuth (Supabase handles that separately).
```

### Task 2.6 — Email System

```
YOUR TASK:
Build all transactional emails from @12-EMAIL-SYSTEM.md using Resend + React Email:

Email Templates (all must match platform visual identity — dark background, brand purple):
1. welcome.tsx — after email verification. "You're in. Here's what happens next."
2. project-submitted.tsx — confirmation with queue position and ETA
3. evaluation-complete.tsx — "Your score is ready." Teases the score without revealing it.
   CTA: "See Your Score" → /dashboard/projects/[id]/result
4. profile-unlocked.tsx — profile is now live with share link
5. certificate-ready.tsx — certificate download link + verification URL
6. level-changed.tsx — "You've reached Builder level!" with new certificate attached
7. queue-update.tsx — "You've moved up to #5 in the queue" (sent at significant jumps: top 10, top 5, #1)

Sending functions in lib/email/send.ts:
- sendWelcomeEmail(userId)
- sendEvaluationCompleteEmail(userId, projectId)
- sendCertificateReadyEmail(userId, certificateId)
- sendLevelChangedEmail(userId, newLevel)
(and so on for each template)

All sending functions use the Resend SDK. Handle send failures gracefully — log but don't crash.
Test each email locally using Resend's email preview feature.
```

### Task 2.7 — Polish + Performance Pass

```
YOUR TASK:
Perform a full quality pass across the entire codebase:

PERFORMANCE:
- Add loading.tsx skeleton screens for every route — no route missing one
- Add error.tsx boundaries for every route group
- Audit Server vs Client components — move 'use client' as deep as possible
- Replace every <img> tag with Next.js <Image> component
- Run `next build` and check for any warnings or errors — fix all of them

SEO:
- generateMetadata() export on every public page (/u/[username], /badge/[id], /community)
- generateStaticParams() for /u/[username] and /badge/[project_id]
- robots.txt: allow all public routes, disallow /dashboard and /admin
- sitemap.xml: all public profile pages and badge pages

ACCESSIBILITY:
- Every button and link has an aria-label if it's icon-only
- Every image has a descriptive alt attribute
- All form inputs have associated labels
- Focus ring visible on every interactive element (not just outline: none)
- Test keyboard navigation through the main user flow

MOBILE:
- Every page works at 375px viewport
- Sidebar → bottom navigation on mobile
- All tap targets minimum 44×44px
- No horizontal scroll on any page

ERROR HANDLING:
- Every API route returns consistent { error: string } shape on failure
- Every form shows field-level error messages (not just a toast)
- 404 page: custom branded design
- 500 page: custom branded design with support copy

After completing all fixes, generate a QA report listing everything that was changed.
```

---

## Correction Prompt (When Agent Goes Off-Spec)

```
That output doesn't match the spec in [FILE].md.

Issue:
- [Describe what's wrong specifically]
- [Quote the relevant line from the MD file that was not followed]

Fix only this issue. Do not change anything else.
Re-read [FILE].md section "[SECTION NAME]" and correct [COMPONENT/FUNCTION].
```
