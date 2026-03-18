import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './emails/**/*.{ts,tsx}',
    './certificates/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand — The New Religion ──────────────────────────────────────
        brand: {
          DEFAULT: '#6366F1', // Indigo — the color of innovation
          light: '#818CF8', // Lighter for hover states
          dark: '#4F46E5', // Deeper for pressed states
          muted: '#EEF2FF', // Whisper of brand
          glow: '#A5B4FC', // Ethereal glow
        },
        // ── Surfaces — Premium Minimalism ──────────────────────────────────
        surface: {
          DEFAULT: '#FAFAFA', // Soft white — easier on eyes than pure white
          card: '#FFFFFF', // Pure white cards float above
          elevated: '#FFFFFF', // Elevated elements
          border: '#E5E7EB', // Subtle boundaries
          'border-light': '#F3F4F6', // Ultra-light borders
          hover: '#F9FAFB', // Hover state background
        },
        // ── Text — Hierarchy & Clarity ─────────────────────────────────────
        text: {
          primary: '#0F172A', // Slate 900 — strong but not harsh
          secondary: '#475569', // Slate 600 — readable secondary
          tertiary: '#94A3B8', // Slate 400 — de-emphasized
          muted: '#CBD5E1', // Slate 300 — placeholders
          inverse: '#FFFFFF', // On dark backgrounds
        },
        // ── Accent — Purposeful Color ──────────────────────────────────────
        accent: {
          purple: '#8B5CF6', // Violet — creativity
          cyan: '#06B6D4', // Cyan — technology
          emerald: '#10B981', // Emerald — success
          green: '#10B981', // Green — success (alias)
          amber: '#F59E0B', // Amber — attention
          gold: '#F59E0B', // Gold — attention (alias)
          rose: '#F43F5E', // Rose — critical
          red: '#EF4444', // Red — error/danger
        },
        // ── Tier Colors — Achievement Spectrum ─────────────────────────────
        tier: {
          '1': '#10B981', // Emerald — foundational
          '2': '#3B82F6', // Blue — builder
          '3': '#8B5CF6', // Violet — architect
        },
        // ── Certificate Levels — Prestige ──────────────────────────────────
        level: {
          architect: '#F59E0B', // Gold — mastery
          builder: '#8B5CF6', // Violet — expertise
          maker: '#06B6D4', // Cyan — proficiency
          foundational: '#10B981', // Emerald — competence
          provisional: '#94A3B8', // Slate — entry
        },
      },
      // ── Typography — Refined Hierarchy ──────────────────────────────────
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'monospace'],
        display: ['var(--font-geist)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      // ── Spacing — Breathing Room ────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // ── Border Radius — Soft Edges ──────────────────────────────────────
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        card: '0.75rem',
        badge: '0.375rem',
      },
      // ── Shadows — Depth & Elevation ─────────────────────────────────────
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        xl: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
        glow: '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.2)',
        brand: '0 8px 24px -4px rgba(99, 102, 241, 0.2)',
        card: '0 0 0 1px rgba(99, 102, 241, 0.08), 0 4px 24px rgba(0, 0, 0, 0.04)',
      },
      // ── Animations — Fluid Motion ───────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-up': 'fade-up 0.5s ease-out',
        'fade-down': 'fade-down 0.5s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      // ── Backdrop Blur ───────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
