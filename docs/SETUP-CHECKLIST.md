# SETUP CHECKLIST — Do This Before the Agent Builds Anything

> This is everything YOU need to set up manually.
> The agent cannot do this for you — it requires accounts, dashboards, and API keys.
> Estimated time: 2–3 hours total, one-time only.

---

## Step 1 — Create Accounts (30 min)

Create free accounts on each of these. Use the same email for all.

| Service | URL | Free Tier |
|---------|-----|-----------|
| Supabase | supabase.com | Free — 500MB DB, 5GB bandwidth |
| Vercel | vercel.com | Free — unlimited deploys |
| Resend | resend.com | Free — 3,000 emails/month |
| Uploadthing | uploadthing.com | Free — 2GB storage |
| Posthog | posthog.com | Free — 1M events/month |
| Stripe | stripe.com | Free to set up — only pay on transactions |
| GitHub | github.com | Already have this |

---

## Step 2 — Create Supabase Project (20 min)

1. Go to supabase.com → New Project
2. Name it: `[platform-name]-dev`
3. Choose a strong database password — **save it somewhere safe**
4. Region: Choose closest to your target users (US East or EU West)
5. Wait for project to spin up (~2 min)

**Get your keys:**
- Go to Project Settings → API
- Copy: `Project URL`, `anon public` key, `service_role` key (keep this secret)

**Enable OAuth providers:**
- Go to Authentication → Providers
- Enable: **GitHub**, **Google**, **LinkedIn**
- For each one, you'll need to create an OAuth app (Step 3)

**Run the database schema:**
- Go to SQL Editor in Supabase
- Paste and run everything from `docs/01-DATABASE-SCHEMA.md` — the SQL blocks
- Run in order: Enums → Tables → Triggers → RLS Policies → Realtime

---

## Step 3 — Create OAuth Apps (30 min)

### GitHub OAuth App
1. GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Application name: `[Platform Name]`
3. Homepage URL: `http://localhost:3000` (update to real URL after launch)
4. Authorization callback URL: `https://[your-supabase-project-ref].supabase.co/auth/v1/callback`
5. Save → get Client ID and Client Secret
6. Paste both into Supabase → Authentication → Providers → GitHub

### Google OAuth App
1. console.cloud.google.com → New Project
2. APIs & Services → OAuth consent screen → External → Fill in app name + email
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs: `https://[your-supabase-project-ref].supabase.co/auth/v1/callback`
6. Get Client ID + Secret → paste into Supabase → GitHub providers → Google

### LinkedIn OAuth App
1. linkedin.com/developers → Create App
2. Fill in app details — use platform name
3. Auth tab → Add redirect URL: `https://[your-supabase-project-ref].supabase.co/auth/v1/callback`
4. Request products: Sign In with LinkedIn + Share on LinkedIn
5. Get Client ID + Secret → paste into Supabase → LinkedIn

---

## Step 4 — Set Up Resend (10 min)

1. resend.com → Create account
2. Add a domain (or use their sandbox for dev — limits to verified emails only)
3. API Keys → Create API key
4. Save the key

---

## Step 5 — Set Up Uploadthing (10 min)

1. uploadthing.com → Create account
2. Create new app: `[platform-name]`
3. Get App ID and Secret key from dashboard

---

## Step 6 — Set Up Posthog (5 min)

1. posthog.com → Create account
2. Create new project
3. Get Project API Key and Host URL from Project Settings

---

## Step 7 — Create the Next.js Project (15 min)

Run this in your terminal:

```bash
npx create-next-app@latest [platform-name] \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd [platform-name]
```

Install dependencies:

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui (run this, then add components as needed)
npx shadcn-ui@latest init

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Data fetching
npm install @tanstack/react-query

# Animations
npm install framer-motion

# Email
npm install resend @react-email/components

# File uploads
npm install uploadthing @uploadthing/react

# Certificate generation
npm install satori sharp pdfkit

# Analytics
npm install posthog-js

# Icons
npm install lucide-react

# Date formatting
npm install date-fns
```

---

## Step 8 — Create `.env.local` File

Create this file in the root of your project. Fill in all values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend
RESEND_API_KEY=[your-resend-key]

# Uploadthing
UPLOADTHING_SECRET=[your-secret]
UPLOADTHING_APP_ID=[your-app-id]

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=[your-posthog-key]
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Stripe (set up but NOT activated — leave placeholder for now)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
```

---

## Step 9 — Connect to Vercel (10 min)

1. Push your project to GitHub: `git init && git add . && git commit -m "init" && git push`
2. vercel.com → Import Project → Select your GitHub repo
3. Add all environment variables from `.env.local` into Vercel's environment variables
4. Deploy → get your `*.vercel.app` URL
5. Update OAuth callback URLs in GitHub/Google/LinkedIn to use the Vercel URL

---

## Step 10 — Copy the Docs Folder

Put all the `docs/*.md` files into your project root. The agent reads them from there.

```
your-project/
  docs/
    00-PROJECT-OVERVIEW.md
    01-DATABASE-SCHEMA.md
    02-AUTH-FLOW.md
    03-USER-DASHBOARD.md
    04-PROJECT-SUBMISSION.md
    05-QUEUE-SYSTEM.md
    06-EVALUATOR-DASHBOARD.md
    07-09-EVALUATION-AND-CERTIFICATES.md
    08-PUBLIC-PROFILE.md
    10-COMMUNITY.md
    11-INTEGRATIONS.md
    12-EMAIL-SYSTEM.md
    13-DESIGN-SYSTEM.md
    AGENT-PROMPT.md
  app/
  ...
```

---

## ✅ You're Done When...

- [ ] Supabase project created and all SQL from `01-DATABASE-SCHEMA.md` has run without errors
- [ ] GitHub, Google, and LinkedIn OAuth apps created and connected in Supabase
- [ ] `.env.local` filled in with real values (not placeholders, except Stripe)
- [ ] `npm run dev` runs without errors at `localhost:3000`
- [ ] Vercel deployment live
- [ ] Docs folder in project root

**At this point — hand everything to the agent with `AGENT-PROMPT.md` and start building.**

---

## What the Agent Handles (You Don't Touch This)

Once setup is done, the agent handles:
- All component code
- All API routes
- All database queries
- All TypeScript types
- All styling
- All animations
- All form validation logic
- Certificate generation code
- Email template code

**You review, test, and give feedback. The agent builds.**
