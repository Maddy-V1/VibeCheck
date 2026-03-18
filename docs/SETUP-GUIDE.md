# SETUP-GUIDE.md — What YOU Do vs What the Agent Does

> Read this before starting any coding session.
> This answers: "Do I need to set anything up, or does the agent handle it?"

---

## Short Answer

You do **7 things manually** (all one-time setup, under 2 hours total).
The agent does **everything else** — every file, every component, every API route.

---

## Your 7 One-Time Setup Tasks

### 1. Create a Supabase Project (10 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it (e.g. `vibecheck-dev`)
3. Choose region closest to your users (recommend: `us-east-1`)
4. Copy these 3 values — you'll need them:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`) ← keep this secret, never expose client-side

### 2. Enable OAuth Providers in Supabase (20 min)

Go to Supabase Dashboard → Authentication → Providers.

**GitHub:**
1. Go to github.com → Settings → Developer Settings → OAuth Apps → New
2. Homepage URL: `http://localhost:3000` (change to prod URL later)
3. Callback URL: `https://[your-supabase-project].supabase.co/auth/v1/callback`
4. Copy Client ID + Secret → paste into Supabase GitHub provider settings

**Google:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs → Credentials → Create OAuth Client
2. Authorised redirect URI: `https://[your-supabase-project].supabase.co/auth/v1/callback`
3. Copy Client ID + Secret → paste into Supabase Google provider settings

**LinkedIn:**
1. Go to [linkedin.com/developers](https://www.linkedin.com/developers/) → Create App
2. Redirect URL: `https://[your-supabase-project].supabase.co/auth/v1/callback`
3. Request scopes: `r_liteprofile`, `r_emailaddress`
4. Copy Client ID + Secret → paste into Supabase LinkedIn provider settings

### 3. Create a Vercel Project (5 min)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import from GitHub (connect your repo first)
3. Framework: Next.js (auto-detected)
4. Don't deploy yet — add env vars first (Step 6)

### 4. Create a Resend Account (5 min)

1. Go to [resend.com](https://resend.com) → Sign Up (free tier)
2. Add your domain or use their test domain for dev
3. Copy API key → `RESEND_API_KEY`

### 5. Create an Uploadthing Account (5 min)

1. Go to [uploadthing.com](https://uploadthing.com) → Sign Up (free tier)
2. Create a new app
3. Copy `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

### 6. Create a Posthog Account (5 min)

1. Go to [posthog.com](https://posthog.com) → Sign Up (free tier, generous limits)
2. Create a project
3. Copy `NEXT_PUBLIC_POSTHOG_KEY` (host is `https://app.posthog.com`)

### 7. Create Your `.env.local` File (5 min)

Create this file at the root of your project. Never commit it to git.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx

# Uploadthing
UPLOADTHING_SECRET=sk_live_xxxxxxxxxxxx
UPLOADTHING_APP_ID=xxxxxxxxxxxx

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Stripe (set up now, don't activate — needed in Phase 3)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Also add all of these to Vercel → Project Settings → Environment Variables.

---

## What the Agent Does (Everything Else)

Once your `.env.local` is set up, the agent handles:

| Task | Agent File |
|------|-----------|
| Create Next.js project with correct config | `00-PROJECT-OVERVIEW.md` |
| Run all Supabase SQL (tables, RLS, triggers) | `01-DATABASE-SCHEMA.md` |
| Build all auth pages and middleware | `02-AUTH-FLOW.md` |
| Build the full dashboard (locked + unlocked) | `03-USER-DASHBOARD.md` |
| Build the submission form (3 steps) | `04-PROJECT-SUBMISSION.md` |
| Build queue + realtime position tracker | `05-QUEUE-SYSTEM.md` |
| Build the internal evaluator tool | `06-EVALUATOR-DASHBOARD.md` |
| Build the score reveal page + animations | `07-09-EVALUATION-AND-CERTIFICATES.md` |
| Build the public profile page | `08-PUBLIC-PROFILE.md` |
| Build certificate + badge generator | `07-09-EVALUATION-AND-CERTIFICATES.md` |
| Build the community feed + comments | `10-COMMUNITY.md` |
| Build GitHub + LinkedIn data pull | `11-INTEGRATIONS.md` |
| Build all transactional emails | `12-EMAIL-SYSTEM.md` |
| Apply the design system throughout | `13-DESIGN-SYSTEM.md` |

---

## How to Run the Supabase SQL

After the agent writes the schema from `01-DATABASE-SCHEMA.md`:

1. Go to your Supabase Dashboard → SQL Editor
2. Paste the SQL from the schema file
3. Run it — all tables, RLS policies, and triggers are created
4. Run `npx supabase gen types typescript --project-id YOUR_ID > lib/types/database.types.ts` to generate TS types

---

## Dev Workflow Day-to-Day

```bash
# Start local dev
npm run dev

# After any Supabase schema change — regenerate types
npx supabase gen types typescript --project-id YOUR_ID > lib/types/database.types.ts

# Deploy to Vercel (auto-deploys on git push to main)
git push origin main
```

---

## Free Tier Limits (What You're Working With)

| Service | Free Tier Limit | When to Upgrade |
|---------|----------------|-----------------|
| Supabase | 500MB DB, 5GB bandwidth | Before going public → Pro $25/mo |
| Vercel | 100GB bandwidth, 100K fn calls/day | Before going public → Pro $20/mo |
| Resend | 100 emails/day | When daily emails exceed 100 → $20/mo |
| Uploadthing | 2GB storage | When video storage fills → $10/mo |
| Posthog | 1M events/month | Only if you hit 1M events |
| Stripe | No monthly cost | Only pay when processing payments (Phase 3) |

**Total cost in development: $0.**
**Total cost at launch (switch to paid tiers): ~$55/month.**

---

## Supabase Storage Buckets to Create Manually

Go to Supabase Dashboard → Storage → New Bucket:

| Bucket Name | Public? | Purpose |
|-------------|---------|---------|
| `badges` | ✅ Public | Project badge PNGs |
| `certificates` | ✅ Public | Profile certificate PNGs + PDFs |
| `avatars` | ✅ Public | User avatar uploads |
| `project-videos` | ❌ Private | Demo video uploads (via Uploadthing URLs anyway) |

---

## When You're Ready to Go Live Checklist

- [ ] Switch Supabase to Pro tier
- [ ] Switch Vercel to Pro tier
- [ ] Update all OAuth callback URLs from localhost to production domain
- [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to production URL
- [ ] Run Lighthouse audit on all public pages — must score > 90
- [ ] Test evaluation flow end-to-end with a real project
- [ ] Test certificate generation with a real evaluation
- [ ] Set up Stripe webhooks pointing to production URL (Phase 3)
