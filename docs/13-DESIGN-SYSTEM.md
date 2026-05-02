# 13 — Design System

> **Every agent building UI must read this file before writing a single component.**
> Read `00-PROJECT-OVERVIEW.md` first.

---

## Core Principle

This platform is vibe coded but must look like it cost $500K to build.
- Every component must be customized — no out-of-the-box shadcn defaults
- Every state must be designed: loading, empty, error, success
- No generic copy — every message is intentional
- Consistent tokens everywhere — never hardcode a color or spacing value

---

## Color Tokens — `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6C47FF',   // Primary purple
          light: '#A78BFA',     // Light purple
          dark: '#4C2DDB',      // Dark purple
          muted: '#F4F1FF',     // Purple tint background
        },
        surface: {
          DEFAULT: '#0D0D1A',   // Page background
          card: '#161628',      // Card background
          elevated: '#1E1E35',  // Elevated card
          border: '#2D2D4E',    // Border color
        },
        accent: {
          cyan: '#00E5FF',      // Neon cyan
          green: '#00F5A0',     // Neon green
          gold: '#FBBF24',      // Gold/amber
          red: '#EF4444',       // Error/danger
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#4B5563',
        },
        tier: {
          1: '#00C853',         // Tier 1 green
          2: '#00B0FF',         // Tier 2 blue
          3: '#A78BFA',         // Tier 3 purple
        },
        level: {
          architect: '#FBBF24',  // Gold
          builder: '#A78BFA',    // Purple
          maker: '#00E5FF',      // Cyan
          foundational: '#00F5A0', // Green
          provisional: '#94A3B8', // Gray
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],  // For large headings
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        card: '0.75rem',
        badge: '0.375rem',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(109, 71, 255, 0.15), 0 4px 24px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(109, 71, 255, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'score-reveal': 'scoreReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    }
  }
}
```

---

## Typography Scale

| Use | Class | Size | Weight |
|-----|-------|------|--------|
| Page title | `text-4xl font-display font-bold` | 36px | 700 |
| Section heading | `text-2xl font-display font-semibold` | 24px | 600 |
| Card heading | `text-lg font-semibold` | 18px | 600 |
| Body | `text-sm` | 14px | 400 |
| Caption / label | `text-xs text-text-secondary` | 12px | 400 |
| Score number | `text-6xl font-display font-bold` | 60px | 700 |
| Badge text | `text-xs font-bold tracking-widest uppercase` | 12px | 700 |

---

## Spacing System

Use Tailwind's default 4px base scale consistently:
- **Component internal padding:** `p-4` (16px) or `p-6` (24px)
- **Section gaps:** `gap-6` (24px) between cards, `gap-4` between items
- **Page padding:** `px-6 py-8` on mobile, `px-8 py-12` on desktop
- **Card border radius:** `rounded-card` (12px)

---

## Component Patterns

### Card

```tsx
// Standard card — use this everywhere, never raw divs with bg colors
<div className="rounded-card border border-surface-border bg-surface-card p-6 shadow-card">
  {children}
</div>
```

### Tier Badge

```tsx
const tierConfig = {
  tier1: { label: 'Tier 1 — Foundational', color: 'text-tier-1 border-tier-1 bg-tier-1/10' },
  tier2: { label: 'Tier 2 — Builder', color: 'text-tier-2 border-tier-2 bg-tier-2/10' },
  tier3: { label: 'Tier 3 — Architect', color: 'text-tier-3 border-tier-3 bg-tier-3/10' },
}

<span className={`inline-flex items-center px-2.5 py-0.5 rounded-badge border text-xs font-bold tracking-widest uppercase ${tierConfig[tier].color}`}>
  {tierConfig[tier].label}
</span>
```

### Score Ring (for evaluation result)

```tsx
// Used across dashboard project cards, community feed cards, badge page related projects.
// Hue-adaptive coloring: red < 40, amber < 70, green >= 70, purple >= 85

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const pct = Math.min(score, 100)
  const hue = pct < 40 ? 0 : pct < 70 ? 45 : pct < 85 ? 145 : 245
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(hsla(${hue},80%,55%,0.85) ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        // Optional glow for community cards:
        // boxShadow: `0 0 24px hsla(${hue},80%,55%,0.15)`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-zinc-950 text-xs font-bold tabular-nums text-white"
        style={{ width: size - 10, height: size - 10 }}
      >
        {Math.round(score)}
      </div>
    </div>
  )
}
```

### Gradient Accent Bar (for project cards)

```tsx
// Thin 4px colored bar at the top of project cards, color matches status
<div
  className="h-1 w-full"
  style={{
    background: `linear-gradient(90deg, ${statusColor}50, ${statusColor}10, transparent)`,
  }}
/>
```

### Timeline Spine (for notifications)

```tsx
// Vertical gradient line connecting notification nodes
<div className="absolute bottom-0 left-[19px] top-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.05] to-transparent" />

// Timeline node — color-coded icon with optional glow for unread items
<div className={cn(
  'flex h-10 w-10 items-center justify-center rounded-xl border',
  accent.bg,
  accent.border,
  !isRead && accent.glow, // e.g. 'shadow-[0_0_20px_rgba(16,185,129,0.12)]'
  'group-hover:scale-110'
)}>
  <Icon size={16} className={accent.icon} />
</div>
```

### Glassmorphism Stat Card

```tsx
// Used on dashboard and projects page for stat overview
<div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition-all duration-300 hover:border-white/[0.12] hover:shadow-lg">
  <div className="mb-3 flex items-center justify-between">
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
      {label}
    </p>
    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
      {icon}
    </div>
  </div>
  <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
  <p className="mt-0.5 text-[11px] text-zinc-600">{detail}</p>
</div>
```

### Skeleton Loader

```tsx
// Use this on every data-loading state — never a spinner alone
<div className="animate-pulse space-y-3">
  <div className="h-5 bg-surface-elevated rounded w-3/4" />
  <div className="h-4 bg-surface-elevated rounded w-1/2" />
  <div className="h-4 bg-surface-elevated rounded w-5/6" />
</div>
```

### Empty State

```tsx
// Every list/feed must have this — never a blank page
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 rounded-full bg-brand-muted flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-brand" />
  </div>
  <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
  <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
  {action && <Button>{action}</Button>}
</div>
```

### Form Field

```tsx
// Always include label, helper text, and error state
<div className="space-y-1.5">
  <Label htmlFor={id} className="text-sm font-medium text-text-primary">
    {label}
    {required && <span className="text-accent-red ml-1">*</span>}
  </Label>
  <Input
    id={id}
    className="bg-surface-card border-surface-border focus:border-brand focus:ring-brand/20"
    {...props}
  />
  {error ? (
    <p className="text-xs text-accent-red">{error}</p>
  ) : helperText ? (
    <p className="text-xs text-text-secondary">{helperText}</p>
  ) : null}
</div>
```

---

## Page Layout Patterns

### Dashboard Layout (private)

```
┌─────────────────────────────────────┐
│ Sidebar (240px) │ Main Content Area │
│  - Logo         │  - Page header    │
│  - Nav items    │  - Content        │
│  - User info    │                   │
└─────────────────────────────────────┘
```

### Public Profile Layout

```
┌─────────────────────────────────────┐
│         Full-width header           │
│    Avatar | Name | Rating | Links   │
├─────────────────────────────────────┤
│  Projects Grid (3 cols desktop)     │
│  [Card] [Card] [Card]               │
└─────────────────────────────────────┘
```

### Auth Pages

```
┌─────────────────────────────────────┐
│  Left (brand/visual) │ Right (form) │
│  50% / 50%           │              │
└─────────────────────────────────────┘
```

---

## Animation Rules

- **Page transitions:** `opacity: 0 → 1`, duration 200ms
- **Card hover:** `translateY(-2px)` or `translateY(-6px)` for community cards, shadow intensifies, duration 300ms
- **Score reveal:** 1.2s cubic-bezier(0.16, 1, 0.3, 1) — feels satisfying
- **Notifications slide in:** from right, 300ms
- **Queue number update:** count-up animation, 600ms
- **Queue pulse:** `animate-pulse` on a 1.5w/1.5h dot (indigo-400)
- **Timeline node hover:** `scale-110` transition, 200ms
- **Unread notification ping:** `animate-ping` on counter badge
- **Active reaction:** `scale-105` + glow shadow transition
- **Loading spinner:** spinning circle border (border-t-indigo-400), not text
- **Never:** jarring, long, or decorative-only animations

---

## Copy / Tone Guide

| Context | Tone | Example |
|---------|------|---------|
| Onboarding | Welcoming, direct | "You're in. Now let's get your work seen." |
| Queue | Reassuring | "You're #12 in line. Estimated 5 days." |
| Evaluation reveal | Celebratory but honest | "Your score is in. Here's what we found." |
| Error messages | Clear, never blame user | "That URL doesn't seem to be working. Check it's publicly accessible." |
| Empty states | Encouraging | "No projects yet — your first submission is one step away." |
| Community | Confident, peer-to-peer | "Join the conversation." |

---

## What To Never Do

- Never use default blue (`#3B82F6`) — we use brand purple
- Never use `text-gray-500` alone — use `text-text-secondary`
- Never show a raw JSON error to users
- Never use `alert()` or `confirm()` — use modal dialogs
- Never leave a loading state without a skeleton
- Never leave a 0-result list without an empty state
- Never use `<table>` for layout — only for actual tabular data
- Never commit commented-out code
