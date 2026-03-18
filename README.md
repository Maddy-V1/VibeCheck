# VibeCheck — Verified Credentials for AI-Native Developers

A professional web platform where vibe coders can submit AI-built projects for expert evaluation, earn verifiable badges and certificates, and build a public portfolio that proves their skills.

## Project Status

**Phase 0 — Foundation: ✅ Complete**
- Next.js 16 with TypeScript strict mode
- Tailwind CSS with custom design system
- Professional, clean aesthetic (Linear/Vercel/Stripe inspired)
- ESLint + Prettier + Husky pre-commit hooks

**Phase 1 — Core MVP: ✅ Complete**
- Authentication system (OAuth + email/password)
- User dashboard (locked/unlocked states)
- Project submission with validation
- Real-time queue system
- Evaluator dashboard
- Evaluation scoring system
- Post-evaluation automation

**Phase 2 — Community, Rankings & Certificates: 🚧 In Progress**
- Animated score reveal page
- Badge generation flow
- Public badge pages with verification
- Public profile pages
- Admin-selected Weekly Top 10 and Monthly Top 50 rankings
- Engagement system (reactions, comments)
- Certificate download system
- Profile rating is not live yet
- Planned profile rating design: 5-star rating + one hashtag-style note tag

**Current Status: Beta MVP + active Phase 2 buildout**

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

Open [http://localhost:3000](http://localhost:3000) to see the platform.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **UI:** shadcn/ui + Tailwind CSS
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **Data Fetching:** TanStack Query
- **Email:** Resend + React Email
- **File Uploads:** Uploadthing
- **Certificates:** Satori + Sharp + PDFKit
- **Analytics:** Posthog
- **Hosting:** Vercel

## Documentation

- **PROJECT-COMPLETE-OVERVIEW.md** — Comprehensive project documentation, current status, all features
- **/docs folder** — Detailed technical documentation:
  - `AGENT-PROMPT.md` — Master briefing for AI agents
  - `00-PROJECT-OVERVIEW.md` — Project scope and architecture
  - `13-DESIGN-SYSTEM.md` — Design tokens and component patterns
  - Feature-specific docs for each phase

## Design Philosophy

This platform is vibe coded but must look like a $500K funded product:
- Dark-first professional aesthetic in the current build
- Every component customized (no default shadcn)
- Skeleton loaders, not spinners
- Intentional copy for every state
- Mobile responsive from 375px
- TypeScript strict mode (no `any`)

## Environment Setup

Create a `.env.local` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Configure OAuth providers (GitHub, Google, LinkedIn)
4. Create storage bucket: `badges` (public)

See `/docs` folder for detailed setup instructions.
