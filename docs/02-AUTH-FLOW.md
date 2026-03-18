# 02 — Auth Flow

> Agent scope: Sign up, sign in, OAuth, session management, middleware.
> Read `00-PROJECT-OVERVIEW.md` and `13-DESIGN-SYSTEM.md` first.

---

## Auth Stack

- **Provider:** Supabase Auth
- **OAuth:** GitHub, Google, LinkedIn
- **Session:** Supabase SSR cookies (not localStorage)
- **Middleware:** Next.js middleware refreshes session on every request

---

## Supabase Auth Setup

```typescript
// lib/supabase/client.ts — Browser client
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

```typescript
// lib/supabase/server.ts — Server component client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database.types'

export const createServerComponentClient = () => {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}
```

```typescript
// middleware.ts — Root level
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes — redirect to sign in if not authenticated
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Admin routes — redirect if not evaluator
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/sign-in', request.url))
    // Additional role check handled in layout
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
```

---

## OAuth Configuration

Configure in Supabase Dashboard → Authentication → Providers:

**GitHub OAuth App:**
- Homepage URL: `https://yourplatform.com`
- Callback URL: `https://yourplatform.com/auth/callback`
- Scopes: `read:user user:email`

**Google OAuth:**
- Authorized redirect URI: `https://yourplatform.com/auth/callback`
- Scopes: `openid email profile`

**LinkedIn OAuth:**
- Redirect URL: `https://yourplatform.com/auth/callback`
- Scopes: `r_liteprofile r_emailaddress`

---

## Pages to Build

### `/sign-in`

```
Layout: Split screen — left brand panel, right form
Components:
  - OAuth buttons (GitHub, Google, LinkedIn) — primary CTAs
  - Email/password form — secondary option
  - Link to /sign-up

OAuth button order: GitHub first (most relevant to audience), then Google, then LinkedIn

Copy:
  - Heading: "Welcome back."
  - Subheading: "Sign in to your [Platform Name] account."
  - GitHub button: "Continue with GitHub"
  - Google button: "Continue with Google"
  - LinkedIn button: "Continue with LinkedIn"
```

### `/sign-up`

```
Layout: Same split screen as sign-in
Components:
  - OAuth buttons (same order)
  - Email/password form
  - Terms acknowledgment checkbox
  - Link to /sign-in

After OAuth sign-up:
  → Trigger profile creation (via DB trigger, not client code)
  → Redirect to /dashboard/onboarding
  
After email sign-up:
  → Send verification email (Supabase handles)
  → Show "Check your email" confirmation screen
```

### `/auth/callback`

```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`)
}
```

### `/dashboard/onboarding`

```
Show once — when onboarding_done is false
Steps:
  1. Confirm display name (pre-filled from OAuth)
  2. Set username (pre-filled, editable, uniqueness check)
  3. Short bio (optional, 300 char limit)
  4. Guidelines acknowledgment (must scroll and check)
  
On complete:
  → Set onboarding_done = true
  → Redirect to /dashboard
```

---

## Session Helpers

```typescript
// lib/supabase/auth-helpers.ts

// Get current user in Server Components
export async function getCurrentUser() {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get current profile in Server Components  
export async function getCurrentProfile() {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

// Sign out
export async function signOut() {
  const supabase = createClient() // browser client
  await supabase.auth.signOut()
  window.location.href = '/'
}
```

---

## Error States to Handle

| Error | Message to User |
|-------|----------------|
| OAuth cancelled | "Sign in was cancelled. Try again." |
| Email already in use | "An account with this email exists. Try signing in." |
| Invalid credentials | "Incorrect email or password." |
| Email not verified | "Check your inbox and verify your email first." |
| Network error | "Something went wrong. Check your connection and try again." |
| Username already taken | "That username is taken. Try another." |
