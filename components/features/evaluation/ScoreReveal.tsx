'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const categoryConfig = [
  {
    key: 'score_functionality',
    label: 'Functionality & Problem Solving',
    max: 25,
    color: '#6C47FF',
  },
  { key: 'score_ux', label: 'UX & Design Quality', max: 20, color: '#00E5FF' },
  { key: 'score_complexity', label: 'Technical Complexity', max: 20, color: '#00B0FF' },
  { key: 'score_deployment', label: 'Deployment & Liveness', max: 10, color: '#00F5A0' },
  { key: 'score_code_quality', label: 'Code & Prompt Quality', max: 10, color: '#FBBF24' },
  { key: 'score_documentation', label: 'Documentation', max: 8, color: '#FF6584' },
  { key: 'score_originality', label: 'Originality & Creativity', max: 7, color: '#A78BFA' },
]

const TIER_CONFIG = {
  tier1: { label: 'Tier 1 — Foundational', color: '#00F5A0' },
  tier2: { label: 'Tier 2 — Builder', color: '#00E5FF' },
  tier3: { label: 'Tier 3 — Architect', color: '#6C47FF' },
}

interface ScoreRevealProps {
  evaluation: any
  project: any
  username?: string | undefined
}

export function ScoreReveal({ evaluation, project, username }: ScoreRevealProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8">
      {/* Phase 1: Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <p className="mb-2 text-sm uppercase tracking-widest text-zinc-500">Evaluation Complete</p>
        <h1 className="text-3xl font-bold text-white">{project.title}</h1>
      </motion.div>

      {/* Phase 2: Main Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <ScoreRing score={evaluation.score_total} tier={evaluation.tier_confirmed} />
      </motion.div>

      {/* Phase 3: Category Breakdown */}
      <div className="mb-8 w-full max-w-lg space-y-3">
        {categoryConfig.map((cat, i) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 + i * 0.1 }}
            className="flex items-center gap-3"
          >
            <span className="w-48 flex-shrink-0 text-xs text-zinc-500">{cat.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(evaluation[cat.key] / cat.max) * 100}%` }}
                transition={{ delay: 1.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="w-8 text-right text-xs font-bold text-white">
              {evaluation[cat.key]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Phase 4: Reviewer Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8 }}
        className="mb-8 w-full max-w-lg rounded-xl border border-white/[0.08] bg-white/[0.025] p-6"
      >
        <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Reviewer Note</p>
        <p className="italic leading-relaxed text-white">"{evaluation.reviewer_note}"</p>
        {evaluation.profiles && (
          <p className="mt-4 text-xs text-zinc-600">
            — {evaluation.profiles.display_name || evaluation.profiles.username}
          </p>
        )}
      </motion.div>

      {/* Phase 5: Badge + CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={`/api/certificates/download?projectId=${project.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Certificate
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/badge/${project.id}`
              const text = `I just got my project "${project.title}" evaluated on VibeCheck! Score: ${evaluation.score_total}/100 🎉`
              const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
              window.open(twitterUrl, '_blank')
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share on Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/badge/${project.id}`
              navigator.clipboard.writeText(url)
              alert('Badge link copied! Share it anywhere.')
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Copy Badge Link
          </Button>
          <a href={project.live_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Project
            </Button>
          </a>
        </div>
        {username && (
          <Link href={`/u/${username}`}>
            <Button>View Public Profile</Button>
          </Link>
        )}
      </motion.div>
    </div>
  )
}

function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const [displayScore, setDisplayScore] = useState(0)
  const tierColor = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.color || '#6C47FF'

  // Animate score counting
  useEffect(() => {
    const duration = 1200 // 1.2s
    const steps = 60
    const increment = score / steps
    const stepDuration = duration / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [score])

  const circumference = 2 * Math.PI * 70
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex flex-col items-center">
      <svg width="160" height="160" className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
          fill="none"
        />
        {/* Animated score circle */}
        <motion.circle
          cx="80"
          cy="80"
          r="70"
          stroke={tierColor}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Score number in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-5xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {displayScore}
        </motion.span>
        <span className="text-sm text-zinc-500">/ 100</span>
      </div>

      {/* Tier badge below */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="mt-4 rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-widest"
        style={{
          borderColor: tierColor,
          backgroundColor: `${tierColor}15`,
          color: tierColor,
        }}
      >
        {TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.label || tier}
      </motion.div>
    </div>
  )
}
