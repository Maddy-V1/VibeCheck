# 11 — Integrations (GitHub + LinkedIn)

> Agent scope: OAuth data pull from GitHub and LinkedIn to populate user profiles.
> Read `00-PROJECT-OVERVIEW.md` and `02-AUTH-FLOW.md` first.

---

## Purpose

When a user signs up or connects GitHub/LinkedIn, we pull their public data to:
- Auto-populate their profile (name, avatar, bio)
- Display GitHub contribution context on their profile
- Suggest tech stack tags when submitting projects
- Strengthen their profile credibility

---

## GitHub Integration

### What We Pull

```typescript
interface GitHubData {
  username: string
  name: string
  avatar_url: string
  bio: string
  public_repos: number
  followers: number
  languages: string[]          // Top languages across repos
  pinned_repos: {              // Up to 6 pinned repos
    name: string
    description: string
    url: string
    language: string
    stars: number
  }[]
}
```

### When to Pull

1. **On OAuth sign-in via GitHub** — pull automatically from Supabase auth metadata
2. **Manual connect** — user connects GitHub from profile settings
3. **Refresh** — user manually refreshes from settings (rate limited to 1x per 24h)

### Implementation

```typescript
// lib/integrations/github.ts

export async function fetchGitHubData(accessToken: string): Promise<GitHubData> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github.v3+json',
  }

  // Basic profile
  const profileRes = await fetch('https://api.github.com/user', { headers })
  const profile = await profileRes.json()

  // Top repos (to infer languages)
  const reposRes = await fetch(
    'https://api.github.com/user/repos?sort=pushed&per_page=20&type=owner',
    { headers }
  )
  const repos = await reposRes.json()

  // Count languages
  const languageCounts: Record<string, number> = {}
  for (const repo of repos) {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] ?? 0) + 1
    }
  }
  const languages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang]) => lang)

  return {
    username: profile.login,
    name: profile.name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    public_repos: profile.public_repos,
    followers: profile.followers,
    languages,
    pinned_repos: repos.slice(0, 6).map(r => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      language: r.language,
      stars: r.stargazers_count,
    })),
  }
}
```

### API Route: Connect GitHub

```typescript
// app/api/integrations/github/route.ts
import { createServerComponentClient } from '@/lib/supabase/server'
import { fetchGitHubData } from '@/lib/integrations/github'

export async function POST(request: Request) {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get GitHub access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession()
  const providerToken = session?.provider_token

  if (!providerToken) {
    return NextResponse.json(
      { error: 'No GitHub token. Sign in with GitHub to connect.' },
      { status: 400 }
    )
  }

  try {
    const githubData = await fetchGitHubData(providerToken)

    await supabase.from('profiles').update({
      github_username: githubData.username,
      github_data: githubData,
      // Only update avatar/name if user hasn't set a custom one
      avatar_url: user.user_metadata.avatar_url ?? githubData.avatar_url,
    }).eq('id', user.id)

    return NextResponse.json({ success: true, data: githubData })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch GitHub data' }, { status: 500 })
  }
}
```

### Using GitHub Data in Submission Form

When user opens the project submission form, pre-suggest tech stack from their GitHub languages:

```typescript
// In project submission form
const { data: profile } = useProfile()
const suggestedTechStack = profile?.github_data?.languages ?? []

// Pass to tech stack multi-select as default suggestions
```

---

## LinkedIn Integration

### What We Pull

```typescript
interface LinkedInData {
  firstName: string
  lastName: string
  headline: string           // e.g. "Full-Stack Developer | Building with AI"
  profilePictureUrl: string
  summary: string
}
```

### LinkedIn OAuth Scopes

LinkedIn OAuth v2 with `r_liteprofile` and `r_emailaddress`:

```
r_liteprofile — firstName, lastName, profilePicture
r_emailaddress — email address
```

Note: LinkedIn's API is restricted. We only get lite profile data without partner access.
**Do not promise users we can pull their full work history — we cannot with standard OAuth.**

### Implementation

```typescript
// lib/integrations/linkedin.ts

export async function fetchLinkedInData(accessToken: string): Promise<LinkedInData> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'cache-control': 'no-cache',
  }

  const profileRes = await fetch(
    'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,headline,profilePicture(displayImage~:playableStreams))',
    { headers }
  )
  const profile = await profileRes.json()

  const firstName = profile.firstName?.localized?.en_US ?? ''
  const lastName = profile.lastName?.localized?.en_US ?? ''
  const headline = profile.headline?.localized?.en_US ?? ''
  const pictureUrl = profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier ?? null

  return { firstName, lastName, headline, profilePictureUrl: pictureUrl, summary: headline }
}
```

### API Route: Connect LinkedIn

```typescript
// app/api/integrations/linkedin/route.ts
export async function POST(request: Request) {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { session } } = await supabase.auth.getSession()
  const providerToken = session?.provider_token

  if (!providerToken) {
    return NextResponse.json({ error: 'Sign in with LinkedIn to connect.' }, { status: 400 })
  }

  try {
    const linkedInData = await fetchLinkedInData(providerToken)

    await supabase.from('profiles').update({
      linkedin_url: `https://linkedin.com/in/${user.id}`, // Best we can do without r_fullprofile
      linkedin_data: linkedInData,
    }).eq('id', user.id)

    return NextResponse.json({ success: true, data: linkedInData })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch LinkedIn data' }, { status: 500 })
  }
}
```

---

## Profile Settings — Integrations Section

```
┌─────────────────────────────────────────────────────────┐
│  Connected Accounts                                     │
│                                                         │
│  GitHub                                                 │
│  [✓ Connected as @johndoe]  [Refresh Data] [Disconnect] │
│                                                         │
│  LinkedIn                                               │
│  [Connect LinkedIn]                                     │
│  Adds your headline to your profile.                    │
└─────────────────────────────────────────────────────────┘
```

---

## Rate Limiting

- GitHub data refresh: max once per 24 hours per user
- LinkedIn: only refreshed on re-authentication (no background refresh)
- Store `github_data_refreshed_at` on profile to enforce rate limit

```typescript
// Check before allowing refresh
const lastRefresh = profile.github_data?.refreshed_at
const hoursSinceRefresh = lastRefresh
  ? (Date.now() - new Date(lastRefresh).getTime()) / 3600000
  : Infinity

if (hoursSinceRefresh < 24) {
  return NextResponse.json(
    { error: 'GitHub data was refreshed recently. Try again tomorrow.' },
    { status: 429 }
  )
}
```
