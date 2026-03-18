# 12 — Email System

> Agent scope: Transactional emails via Resend + React Email templates.
> Read `00-PROJECT-OVERVIEW.md` first.

---

## Stack

- **Resend** — email sending API (free tier: 3,000 emails/month, 100/day)
- **React Email** — React components that render to HTML email
- **Templates stored** in `/emails/` directory

---

## Setup

```typescript
// lib/email/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  const { data, error } = await resend.emails.send({
    from: '[Platform Name] <noreply@yourplatform.com>',
    to,
    subject,
    react,
  })

  if (error) {
    console.error('Email send failed:', error)
    // Don't throw — email failure should never break the main flow
  }

  return { data, error }
}
```

---

## Email Templates

All templates live in `/emails/`. They are React components using `@react-email/components`.

### Base Layout

```tsx
// emails/BaseEmail.tsx
import {
  Html, Head, Preview, Body, Container, Section,
  Text, Link, Hr, Img
} from '@react-email/components'

export function BaseEmail({ preview, children }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#0D0D1A', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px' }}>
          
          {/* Header */}
          <Section style={{ marginBottom: 32 }}>
            <Text style={{ color: '#6C47FF', fontSize: 20, fontWeight: 700, margin: 0 }}>
              [Platform Name]
            </Text>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Hr style={{ borderColor: '#2D2D4E', margin: '32px 0' }} />
          <Text style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>
            You're receiving this because you have an account on [Platform Name].{' '}
            <Link href="{{unsubscribe}}" style={{ color: '#6C47FF' }}>Unsubscribe</Link>
          </Text>

        </Container>
      </Body>
    </Html>
  )
}
```

---

### Template 1: Evaluation Complete

**Trigger:** When evaluator submits evaluation
**Subject:** `Your project "[Title]" has been evaluated — see your score`

```tsx
// emails/EvaluationComplete.tsx
import { BaseEmail } from './BaseEmail'
import { Section, Text, Button, Row, Column } from '@react-email/components'

interface Props {
  displayName: string
  projectTitle: string
  score: number
  tier: 'tier1' | 'tier2' | 'tier3'
  reviewerNote: string
  resultUrl: string
}

const tierLabels = { tier1: 'Tier 1 — Foundational', tier2: 'Tier 2 — Builder', tier3: 'Tier 3 — Architect' }

export function EvaluationComplete({ displayName, projectTitle, score, tier, reviewerNote, resultUrl }: Props) {
  return (
    <BaseEmail preview={`Your score for ${projectTitle} is in — ${score}/100`}>
      
      <Section>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Hey {displayName} 👋
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.6 }}>
          Your project has been evaluated. Here's the summary:
        </Text>
      </Section>

      {/* Score card */}
      <Section style={{ backgroundColor: '#161628', borderRadius: 12, padding: '24px', border: '1px solid #2D2D4E', marginBottom: 24 }}>
        <Text style={{ color: '#A78BFA', fontSize: 11, letterSpacing: 3, margin: '0 0 8px' }}>
          PROJECT EVALUATED
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
          {projectTitle}
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 16px' }}>
          {tierLabels[tier]}
        </Text>
        <Text style={{ color: '#6C47FF', fontSize: 48, fontWeight: 700, margin: '0 0 4px' }}>
          {score}<span style={{ fontSize: 20, color: '#4B5563' }}>/100</span>
        </Text>
      </Section>

      {/* Reviewer note */}
      <Section style={{ backgroundColor: '#161628', borderRadius: 12, padding: '20px', border: '1px solid #2D2D4E', marginBottom: 24 }}>
        <Text style={{ color: '#A78BFA', fontSize: 11, letterSpacing: 2, margin: '0 0 8px' }}>REVIEWER NOTE</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
          "{reviewerNote}"
        </Text>
      </Section>

      <Button
        href={resultUrl}
        style={{
          backgroundColor: '#6C47FF', color: '#FFFFFF', borderRadius: 8,
          padding: '14px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none',
        }}
      >
        See Full Score Breakdown →
      </Button>

    </BaseEmail>
  )
}
```

---

### Template 2: Project Submitted / Queue Confirmation

**Trigger:** Project submission + queue entry
**Subject:** `You're in the queue — [Project Title]`

```tsx
// emails/QueueConfirmation.tsx
export function QueueConfirmation({ displayName, projectTitle, queuePosition, estimatedDays, dashboardUrl }) {
  return (
    <BaseEmail preview={`${projectTitle} is #${queuePosition} in the evaluation queue`}>
      <Section>
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 700 }}>You're in! ✓</Text>
        <Text style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.6 }}>
          <strong style={{ color: '#FFFFFF' }}>{projectTitle}</strong> has been added to the evaluation queue.
        </Text>
      </Section>

      <Section style={{ backgroundColor: '#161628', borderRadius: 12, padding: '24px', border: '1px solid #2D2D4E', marginBottom: 24 }}>
        <Row>
          <Column>
            <Text style={{ color: '#A78BFA', fontSize: 11, letterSpacing: 2, margin: '0 0 4px' }}>QUEUE POSITION</Text>
            <Text style={{ color: '#6C47FF', fontSize: 40, fontWeight: 700, margin: 0 }}>#{queuePosition}</Text>
          </Column>
          <Column>
            <Text style={{ color: '#A78BFA', fontSize: 11, letterSpacing: 2, margin: '0 0 4px' }}>ESTIMATED</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 600, margin: 0 }}>~{estimatedDays} days</Text>
          </Column>
        </Row>
      </Section>

      <Text style={{ color: '#94A3B8', fontSize: 14 }}>
        We'll notify you by email and in the app the moment your evaluation is ready.
      </Text>

      <Button href={dashboardUrl} style={{ backgroundColor: '#6C47FF', color: '#FFFFFF', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600 }}>
        View Dashboard
      </Button>
    </BaseEmail>
  )
}
```

---

### Template 3: Profile Rating Unlocked

**Trigger:** After 3rd project evaluated
**Status:** Deferred until the redesigned Phase 2 profile rating system ships

**Planned direction:** 5-star rating + one hashtag-style note tag

**Old concept below is deprecated and should not be treated as final product direction.**

**Subject:** `Your Profile Rating is live`

```tsx
// emails/ProfileRatingUnlocked.tsx
export function ProfileRatingUnlocked({ displayName, rating, level, profileUrl }) {
  const levelLabel = { architect: 'Architect', builder: 'Builder', maker: 'Maker', foundational: 'Foundational', provisional: 'Provisional' }

  return (
    <BaseEmail preview={`Your Profile Rating: ${rating}/100 — ${levelLabel[level]} level`}>
      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 700 }}>
        Your Profile Rating is live ✦
      </Text>
      <Text style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.6 }}>
        You've had 3 projects evaluated. Your overall rating is now public.
      </Text>

      <Section style={{ backgroundColor: '#161628', borderRadius: 12, padding: '28px', border: '1px solid #2D2D4E', textAlign: 'center', marginBottom: 24 }}>
        <Text style={{ color: '#FBBF24', fontSize: 52, fontWeight: 700, margin: '0 0 4px' }}>{rating}</Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, margin: '0 0 16px' }}>/ 100 Profile Rating</Text>
        <Text style={{ color: '#A78BFA', fontSize: 12, letterSpacing: 3, fontWeight: 700 }}>
          ✦ {levelLabel[level].toUpperCase()} LEVEL
        </Text>
      </Section>

      <Button href={profileUrl} style={{ backgroundColor: '#6C47FF', color: '#FFFFFF', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600 }}>
        View Your Public Profile
      </Button>
    </BaseEmail>
  )
}
```

---

### Template 4: Certificate Level Changed

**Trigger:** Profile rating recalculation pushes user to new level
**Subject:** `You've reached [Level] level — download your new certificate`

Simple email noting the level change, linking to profile where they can download.

---

## Sending Emails — Usage

```typescript
// Example: Sending evaluation complete email
import { sendEmail } from '@/lib/email/resend'
import { EvaluationComplete } from '@/emails/EvaluationComplete'

await sendEmail({
  to: userEmail,
  subject: `Your project "${projectTitle}" has been evaluated`,
  react: EvaluationComplete({
    displayName: profile.display_name,
    projectTitle: project.title,
    score: evaluation.score_total,
    tier: evaluation.tier_confirmed,
    reviewerNote: evaluation.reviewer_note,
    resultUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${project.id}/result`,
  }),
})
```

---

## Email Triggers Map

| Trigger | Template | Who |
|---------|----------|-----|
| Project submitted | QueueConfirmation | Submitter |
| Evaluation complete | EvaluationComplete | Submitter |
| Profile rating unlocked (3+ projects) | ProfileRatingUnlocked | User |
| Certificate level changed | LevelChanged | User |
| Moderation action | ModerationNotice | User actioned |
| Welcome (after onboarding) | Welcome | New user |

---

## Preview & Testing

```bash
# React Email dev server — preview templates at localhost:3000
npx react-email dev --dir emails

# Test sending
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"template": "evaluation-complete", "to": "test@example.com"}'
```
