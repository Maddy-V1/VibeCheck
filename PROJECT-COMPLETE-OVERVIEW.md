# VibeCheck - Complete Project Overview

## 🎯 Project Summary

**VibeCheck** is a professional web platform where AI-native developers ("vibe coders") can submit their AI-built projects for expert evaluation, earn verifiable badges and certificates, and build a public portfolio that proves their skills.

**Current Status:** Phase 0 + Phase 1 complete, Phase 2 in progress
**Tech Stack:** Next.js 16 (App Router), TypeScript (strict), Supabase, Tailwind CSS, shadcn/ui

---

## 📊 Database Schema Overview

### Core Tables (11 total)

1. **profiles** - User accounts extending Supabase auth.users
   - Username, display name, avatar, bio
   - Placeholder fields for future profile rating work
   - Community status (active/warned/suspended/banned)
   - Evaluator role (associate/senior)

2. **projects** - User-submitted projects
   - Title, description, tier (1-3), status
   - Live URL, GitHub URL, demo video
   - Tech stack array
   - Queue position, evaluation reference
   - Engagement counts (reactions, comments)

3. **evaluations** - Expert project reviews
   - 7 scoring categories (total max 100):
     - Functionality (25), UX (20), Complexity (20)
     - Deployment (10), Code Quality (10), Documentation (8), Originality (7)
   - Reviewer note (shown to user)
   - Internal notes (team only)
   - Tier confirmation

4. **queue** - Evaluation queue management
   - Position (auto-assigned by trigger)
   - Plan (priority/free) - priority always first
   - Estimated days (30 evals/day capacity)
   - Assigned evaluator

5. **badges** - Verifiable credentials
   - Project badges (per evaluated project)
   - Profile certificates (overall rating)
   - Verification ID, shareable links
   - Certificate URLs (PNG/PDF)

6. **community_posts** - Community feed posts
   - User-generated content
   - Project references
   - Moderation status
   - Engagement tracking

7. **reactions** - Unified reactions system
   - For both community posts AND projects
   - Types: like, helpful, insightful, fire, celebrate
   - One reaction per user per item

8. **comments** - Unified comments system
   - For both community posts AND projects
   - One level of nesting (replies to top-level only)
   - Edit window (15 minutes)
   - Moderation status

9. **comment_reactions** - Reactions on comments
10. **comment_flags** - User reports (auto-flags at 3+ reports)
11. **notifications** - In-app notifications
12. **project_rankings** - Admin-selected weekly/monthly leaderboard entries

### Key Database Features

- **Row Level Security (RLS)** enabled on all tables
- **Realtime** enabled for queue and notifications
- **Triggers** for:
  - Auto-create profile on signup (with duplicate username handling)
  - Queue position assignment (priority before free)
  - Queue position shifting on deletion
  - Engagement count updates (reactions, comments)
  - Updated_at timestamps
  - Evaluation score validation

---

## 🗂️ Migration History (In Sequence)

### Base Schema
**File:** `supabase/schema.sql`
- Creates all 11 tables with enums
- Sets up RLS policies
- Creates core triggers (profile creation, queue management, updated_at)
- Enables Realtime for queue and notifications
- **Status:** ✅ Complete and idempotent

### Migration 02: Soft Delete & Reactions
**File:** `supabase/02_soft_delete_and_reactions.sql`
- Adds soft delete columns to profiles and projects
- Creates `post_reactions` table (later replaced)
- Soft delete functions (schedule, cancel, execute, restore, hard delete)
- Scheduled deletion processing
- Helper views for active/pending deletion items
- **Status:** ✅ Applied (some parts superseded by migration 04)

### Migration 03: Community Engagement
**File:** `supabase/03_community_engagement.sql`
- Creates `comments` table (project-only)
- Creates `comment_reactions` table
- Creates `comment_reaction_counts` materialized table
- Comment management functions (add, edit, delete, flag, moderate)
- Auto-flag trigger (3+ reports)
- Detailed views for comments
- **Status:** ✅ Applied (superseded by migration 04)

### Migration 04: Complete Engagement System
**File:** `supabase/04_complete_engagement_system.sql`
- **MAJOR REFACTOR** - Fresh start for engagement
- Drops old structures from migrations 02-03
- Creates unified `reactions` table (community posts + projects)
- Creates unified `comments` table (community posts + projects)
- Adds engagement count columns to community_posts and projects
- Creates all triggers for auto-updating counts
- Helper functions for toggling reactions and adding comments
- Views for engagement metrics
- **Status:** ✅ Applied - Current engagement system

### Migration 05: Handle New User Fix
**File:** `supabase/05_fix_handle_new_user.sql`
- Improves username generation from OAuth metadata
- Better handling of special characters
- Ensures minimum 3 character usernames
- Retry logic for duplicate usernames
- **Status:** ✅ Applied (superseded by 06)

### Migration 06: Final Handle New User Fix
**File:** `supabase/06_final_handle_new_user_fix.sql`
- More robust retry loop (up to 5 attempts)
- Explicit column specification in INSERT
- Sets all required profile columns with defaults
- Better error handling
- **Status:** ✅ Applied (superseded by 07)

### Migration 07: Handle New User with Logging
**File:** `supabase/07_final_fix_with_logging.sql`
- Creates `auth_trigger_logs` table for debugging
- Comprehensive error handling with logging
- Up to 10 retry attempts for username conflicts
- Handles CHECK violations
- Logs all errors for debugging
- Creates `auth_trigger_errors` view
- **Status:** ✅ Applied - Current version

### Migration 08: Username Checker
**File:** `supabase/08_username_checker.sql`
- Creates `check_username_available()` function
- SECURITY DEFINER to bypass RLS
- Used in onboarding for real-time validation
- Returns true if available or belongs to current user
- **Status:** ✅ Applied

### Migration 09: Queue Triggers
**File:** `supabase/09_queue_triggers.sql`
- `assign_queue_position()` trigger function
- `shift_queue_positions()` trigger function
- Enables Realtime for queue table
- **Status:** ✅ Applied (also in schema.sql)

### Migration 10: Evaluator RLS Policies (ROLLED BACK)
**File:** `supabase/10_evaluator_rls_policies.sql`
- Attempted to add RLS policies for evaluators
- **ISSUE:** Created policy loops and conflicts with existing RLS
- Interfered with user policies, queue policies, and more
- Caused circular dependencies and access issues
- **Status:** ❌ Rolled back by migration 11

### Migration 11: Rollback Fix
**File:** `supabase/11_rollback_10.sql`
- Removes all changes from migration 10
- Drops problematic evaluator policies:
  - Projects policies (read/update)
  - Queue policies (read/update/delete)
  - Evaluations policies (create/read/update)
  - Profiles policies (read)
  - Badges policies (create/update/read)
  - Notifications policies (create)
- Drops helper functions (make_evaluator, remove_evaluator, etc.)
- Restores database to stable state (schema.sql + migrations 02-09)
- **Status:** ✅ Applied - Current stable state

### Verification Script
**File:** `supabase/verify_database_state.sql`
- Checks evaluator status
- Lists all evaluators
- Shows projects and queue
- Verifies policies exist
- **Status:** 🔧 Diagnostic tool

---

## 🏗️ Application Structure

### Route Groups

#### (auth) - Authentication Pages
- `/sign-in` - OAuth + email/password sign-in
- `/sign-up` - OAuth + email/password sign-up
- `/auth/callback` - OAuth callback handler
- Split layout: animated brand panel + form

#### (dashboard) - Private User Area
- `/dashboard` - Overview with stats + recent projects
- `/dashboard/onboarding` - 4-step onboarding (username, bio, guidelines)
- `/dashboard/projects` - Full projects list with queue section
- `/dashboard/projects/[id]` - Project detail page
- `/dashboard/submit` - Project submission form
- `/dashboard/settings` - User settings
- Sidebar layout with navigation

#### (admin) - Evaluator Dashboard
- `/admin` - Queue list (all projects awaiting evaluation)
- `/admin/evaluate/[projectId]` - Evaluation scoring form
- Protected by `is_evaluator = true` check

#### (public) - Public Pages
- `/` - Landing page (dark theme)
- `/u/[username]` - Public profile pages ✅
- `/badge/[projectId]` - Public badge page ✅
- `/verify/[certId]` - Certificate verification ✅

### API Routes

#### User APIs
- `POST /api/projects/submit` - Submit project for evaluation
- `GET /api/queue/position/[projectId]` - Get queue position
- `POST /api/certificates/generate` - Generate badge/certificate ✅
- `GET /api/certificates/download` - Download certificate ✅

#### Admin APIs
- `GET /api/admin/projects/[projectId]` - Get project for evaluation
- `POST /api/admin/queue/pickup` - Assign project to evaluator
- `POST /api/admin/queue/complete` - Remove from queue
- `POST /api/admin/evaluations/submit` - Submit evaluation scores

#### Utility APIs
- `POST /api/check-url` - Validate live URL accessibility
- `GET /api/debug/projects` - Debug endpoint

---

## 🎨 Design System

### Color Palette (Light Mode First)

**Brand:**
- Primary: `#6366F1` (Indigo)
- Light: `#818CF8`
- Dark: `#4F46E5`
- Muted: `#EEF2FF`

**Surfaces:**
- Default: `#FAFAFA` (soft white)
- Card: `#FFFFFF` (pure white)
- Border: `#E5E7EB`

**Text:**
- Primary: `#0F172A` (Slate 900)
- Secondary: `#475569` (Slate 600)
- Tertiary: `#94A3B8` (Slate 400)

**Tiers:**
- Tier 1: `#10B981` (Emerald)
- Tier 2: `#3B82F6` (Blue)
- Tier 3: `#8B5CF6` (Violet)

**Certificate Levels:**
- Architect: `#F59E0B` (Gold)
- Builder: `#8B5CF6` (Violet)
- Maker: `#06B6D4` (Cyan)
- Foundational: `#10B981` (Emerald)
- Provisional: `#94A3B8` (Slate)

### Typography
- **Display:** Geist (headings, large text)
- **Body:** Geist (paragraphs, UI)
- **Mono:** Geist Mono (code)

### Component Patterns
- Cards: `rounded-card` (12px), shadow-card
- Badges: `rounded-badge` (6px), uppercase, tracking-widest
- Buttons: Smooth transitions, hover states, active scale
- Skeleton loaders (not spinners)
- Designed empty states for all lists

---

## 🔐 Authentication Flow

```
User → Sign In/Up
  ↓
OAuth (GitHub/Google/LinkedIn) OR Email/Password
  ↓
Session Created (Supabase Auth)
  ↓
Profile Auto-Created (DB trigger)
  ↓
Check onboarding_done
  ↓
No → /dashboard/onboarding (4 steps)
  ↓
Yes → /dashboard
```

### Onboarding Steps
1. Confirm display name (pre-filled from OAuth)
2. Set username (uniqueness check, 3-30 chars)
3. Optional bio (300 char max)
4. Community guidelines (scroll + checkbox)

### Middleware Protection
- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires authentication + evaluator role

---

## 📋 User Journey

### New User
1. Sign up via OAuth or email
2. Complete onboarding (username, bio, guidelines)
3. See locked dashboard with blurred profile preview
4. Submit first project
5. Enter queue, see live position updates
6. Wait for evaluation
7. Receive notification when evaluated
8. View score reveal page (animated)
9. Profile unlocks, becomes public
10. Can now participate in community

### Evaluator
1. Sign in with evaluator account (is_evaluator = true)
2. Access `/admin` queue dashboard
3. Pick up project (max 3 active at once)
4. Review project (live URL, GitHub, demo)
5. Score across 7 categories
6. Write reviewer note (50-500 chars)
7. Submit evaluation
8. System automatically:
   - Updates project status
   - Makes project public
   - Removes from queue
   - Generates badge
   - Sends notification
   - Triggers certificate generation

**Note:** Evaluator operations use service role client (bypasses RLS) since migration 10's RLS policies were rolled back due to policy loop issues.

---

## 🔄 Queue System

### Rules
- **Priority plan** always before **free plan**
- Within same plan: FIFO (first in, first out)
- Position auto-assigned by trigger
- Positions shift up when project removed
- Real-time updates via Supabase Realtime

### Capacity
- 30 evaluations per day
- ETA calculated: `Math.ceil(position / 30)` days

### Status Flow
```
draft → submitted → in_queue → evaluating → evaluated
                                    ↓
                                rejected
```

---

## 🎓 Scoring System

### Categories (Total: 100 points)
- Functionality & Problem Solving: 25
- UX & Design Quality: 20
- Technical Complexity: 20
- Deployment & Liveness: 10
- Code & Prompt Quality: 10
- Documentation & Presentation: 8
- Originality & Creativity: 7

### Tier System
- **Tier 1 (Foundational):** To-do apps, landing pages, basic CRUD
- **Tier 2 (Builder):** Full-stack apps, auth systems, API integrations
- **Tier 3 (Architect):** AI tools, dev platforms, open source projects

### Profile Rating
- **Not complete yet**
- Final Phase 2 direction:
  - 5-star rating
  - one hashtag-style note tag
  - unlocks after 3+ evaluated projects

### Certificate Levels
- **Provisional:** 0-39 points
- **Foundational:** 40-59 points
- **Maker:** 60-74 points
- **Builder:** 75-89 points
- **Architect:** 90-100 points

---

## 🎨 Key Features Implemented

### ✅ Authentication System
- OAuth (GitHub, Google, LinkedIn)
- Email/password with verification
- 4-step onboarding flow
- Session management via middleware
- Auto-profile creation on signup

### ✅ Dashboard System
- Locked state (pre-evaluation)
- Unlocked state (post-evaluation)
- Sidebar navigation
- Project cards with status badges
- Real-time queue position tracking
- Notifications panel

### ✅ Project Submission
- Multi-step form validation (Zod)
- Live URL accessibility check
- Tech stack tagging
- Confirmation checklist
- Unique slug generation
- Auto-queue entry

### ✅ Queue System
- Auto-position assignment
- Priority vs free plan ordering
- Real-time position updates
- ETA calculation
- Position shifting on removal

### ✅ Evaluator Dashboard
- Queue list view
- Project pickup (max 3 active)
- Evaluation scoring form
- Score validation
- Reviewer notes
- Auto-notification on completion
- Uses service role client (bypasses RLS)

### ✅ Score Reveal & Badges
- Animated score reveal page (5-phase Framer Motion)
- Badge generation (Satori + Sharp)
- Public badge pages (`/badge/[projectId]`)
- Verification system (`/verify/[certId]`)
- Certificate download
- Shareable badge links

### ✅ Public Profiles
- Public profile pages (`/u/[username]`)
- Profile header and shareable public identity
- Projects grid with evaluated/non-evaluated states
- Social links (GitHub, LinkedIn)
- Share profile functionality
- SEO optimized with OpenGraph metadata

### ✅ Engagement System
- Unified reactions (posts + projects)
- Unified comments (posts + projects)
- Auto-count updates via triggers
- Comment reactions
- Comment flagging (auto-flag at 3+)
- Moderation tools

---

## 📁 Project Structure

```
/app
  /(auth)              - Sign in, sign up, callback
  /(dashboard)         - Private user dashboard
  /(admin)             - Evaluator dashboard
  /(public)            - Public profiles (TODO)
  /api                 - API route handlers
  /auth/callback       - OAuth callback

/components
  /ui                  - shadcn base components (customized)
  /features            - Feature-specific components
    /auth              - Brand panel, OAuth buttons
    /dashboard         - Sidebar, locked/unlocked states
    /queue             - Queue position badge
  /layouts             - Page layout wrappers

/lib
  /supabase            - Client, server, service, auth helpers
  /types               - Database types, convenience exports
  /utils               - Helpers (slug, queue, cn)
  /validations         - Zod schemas (project, evaluation)

/supabase
  schema.sql           - Base schema (run first)
  02-11_*.sql          - Migrations (run in order)
  verify_*.sql         - Diagnostic tools

/docs
  00-PROJECT-OVERVIEW.md      - Master overview
  01-DATABASE-SCHEMA.md       - Schema documentation
  02-AUTH-FLOW.md             - Auth implementation guide
  03-USER-DASHBOARD.md        - Dashboard specs
  04-PROJECT-SUBMISSION.md    - Submission flow
  05-QUEUE-SYSTEM.md          - Queue logic
  06-EVALUATOR-DASHBOARD.md   - Admin tool specs
  07-09-*.md                  - Evaluation & certificates
  13-DESIGN-SYSTEM.md         - Design tokens & patterns
```

---

## 🔧 Environment Variables

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional (Phase 3)
```bash
# Resend (email)
RESEND_API_KEY=re_xxx

# Uploadthing (file uploads)
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=xxx

# Posthog (analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Stripe (deferred)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run migrations 02-11 in sequence (optional, most features in schema.sql)
4. Configure OAuth providers in Auth settings
5. Copy environment variables to `.env.local`

### 3. Create Test Evaluator
```sql
-- In Supabase SQL Editor
-- Manually update profiles table (make_evaluator function was rolled back)
UPDATE profiles 
SET is_evaluator = true, evaluator_role = 'senior'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Test Flow
1. Sign up at `/sign-up`
2. Complete onboarding
3. Submit project at `/dashboard/submit`
4. Sign in as evaluator at `/admin`
5. Pick up and evaluate project
6. Check user receives notification

---

## 📊 Current Implementation Status

### Phase 0 - Foundation ✅
- Next.js 16 + TypeScript strict
- Tailwind CSS + custom design system
- ESLint + Prettier + Husky
- Folder structure
- Design tokens

### Phase 1 - Core MVP ✅
- Authentication (OAuth + email)
- User dashboard (locked/unlocked states)
- Project submission
- Queue system with real-time updates
- Evaluator dashboard
- Evaluation scoring
- Basic notifications

### Phase 2 - Community, Rankings & Certificates 🚧
- Engagement system (reactions, comments)
- Badge generation (Satori + Sharp)
- Animated score reveal page
- Public badge pages with verification
- Public profile pages (`/u/[username]`)
- Certificate download system
- Admin-selected Weekly Top 10 and Monthly Top 50 rankings
- Profile rating redesign still pending

### Phase 3 - Scale & Monetization ⏳
- Email notifications (Resend)
- Community feed page
- Paid priority queue (Stripe)
- Community evaluation
- Advanced analytics
- Scale hardening

---

## 🎯 Key Design Decisions

1. **No separate backend** - Next.js API routes handle all server logic
2. **Supabase RLS** - Security at database level, not application level
3. **Service role for queue** - Bypasses RLS for queue operations
4. **Realtime for queue** - Live position updates without polling
5. **Soft delete** - Profiles and projects can be restored
6. **Unified engagement** - Same reactions/comments for posts + projects
7. **One evaluation per project** - UNIQUE constraint on evaluations.project_id
8. **Profile unlocks at 1 evaluation** - Public profile after first review
9. **Profile rating is deferred** - final Phase 2 direction is 5 stars + one hashtag-style note tag
10. **Dark-first current implementation** - current UI direction in code

---

## 🐛 Known Issues & Fixes

### Issue: Username Conflicts on Signup
**Fixed in:** Migration 07
**Solution:** Retry loop with logging, up to 10 attempts

### Issue: Type Errors on Supabase Operations
**Fixed in:** Complete database.types.ts rewrite
**Solution:** Added all table definitions with proper Row/Insert/Update types

### Issue: Queue Position Race Conditions
**Fixed in:** Migration 09 + schema.sql
**Solution:** LOCK TABLE in assign_queue_position() function

### Issue: Evaluator RLS Policy Loops
**Occurred in:** Migration 10
**Problem:** Evaluator RLS policies created circular dependencies and interfered with existing user/queue policies
**Fixed in:** Migration 11 (rollback)
**Current Solution:** Evaluator operations use service role client to bypass RLS entirely

---

## 📝 Next Development Tasks

### High Priority
1. ~~Score reveal page with animations~~ ✅ Complete
2. ~~Certificate PDF generation (Satori + Sharp + PDFKit)~~ ✅ Complete
3. ~~Public profile pages (`/u/[username]`)~~ ✅ Complete
4. Email notifications (Resend integration)
5. Community feed page

### Medium Priority
6. Profile rating redesign (5 stars + hashtag note tag)
7. Project sharing functionality (Twitter, LinkedIn)
8. Admin user management
9. Moderation tools UI
10. Advanced search/filtering

### Low Priority
11. Analytics dashboard
12. Email templates (React Email)
13. Profile customization
14. Integration with GitHub/LinkedIn APIs
15. Paid priority queue (Stripe)

---

## 🔍 Testing Checklist

### Authentication ✅
- OAuth sign-in (GitHub, Google, LinkedIn)
- Email/password sign-in
- Email verification
- Onboarding flow
- Username uniqueness check
- Session persistence

### Dashboard ✅
- Locked state display
- Unlocked state display
- Project cards render correctly
- Queue position updates in real-time
- Notifications display

### Project Submission ✅
- Form validation
- Slug generation
- Queue entry creation
- Position assignment
- Notification creation

### Evaluator Flow ✅
- Queue list displays
- Project pickup
- Evaluation form validation
- Score calculation
- Evaluation submission
- Project status update
- Queue removal

### Database ✅
- All tables created
- RLS policies working
- Triggers firing correctly
- Realtime subscriptions active
- Type generation working

---

## 📚 Documentation Files

All documentation in `/docs`:
- `00-PROJECT-OVERVIEW.md` - Master overview
- `01-DATABASE-SCHEMA.md` - Complete schema reference
- `02-AUTH-FLOW.md` - Authentication implementation
- `03-USER-DASHBOARD.md` - Dashboard specifications
- `04-PROJECT-SUBMISSION.md` - Submission flow
- `05-QUEUE-SYSTEM.md` - Queue logic
- `06-EVALUATOR-DASHBOARD.md` - Admin tool specs
- `07-09-EVALUATION-AND-CERTIFICATES.md` - Scoring & certificates
- `08-PUBLIC-PROFILE.md` - Public profile specs
- `13-DESIGN-SYSTEM.md` - Design tokens & patterns

---

## 🎉 Summary

VibeCheck is a strong beta-stage platform for AI-native developers to get their work evaluated and verified. The core infrastructure (auth, database, queue, evaluation, public profiles, badges) is in place, and Phase 2 is currently being expanded.

**Current State:** Working MVP with active Phase 2 development
**Next Milestone:** Complete Phase 2, including the redesigned profile rating system
**Status:** Beta-ready, not fully Phase 2 complete yet
