'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Share2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CertificatePreview } from '@/components/features/evaluation/CertificatePreview'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'

const categoryConfig = [
  { key: 'score_functionality', label: 'Functionality', max: 25, color: '#6C47FF' },
  { key: 'score_ux', label: 'UX & Design', max: 20, color: '#00E5FF' },
  { key: 'score_complexity', label: 'Complexity', max: 20, color: '#00B0FF' },
  { key: 'score_deployment', label: 'Deployment', max: 10, color: '#00F5A0' },
  { key: 'score_code_quality', label: 'Code Quality', max: 10, color: '#FBBF24' },
  { key: 'score_documentation', label: 'Documentation', max: 8, color: '#FF6584' },
  { key: 'score_originality', label: 'Originality', max: 7, color: '#A78BFA' },
]

const TIER_CONFIG = {
  tier1: { label: 'Tier 1 — Foundational', color: '#00F5A0' },
  tier2: { label: 'Tier 2 — Builder', color: '#00E5FF' },
  tier3: { label: 'Tier 3 — Architect', color: '#6C47FF' },
}

interface PublicResultsPanelProps {
  evaluation: any
  project: any
  username?: string | undefined
  displayName?: string | undefined
}

export function PublicResultsPanel({
  evaluation,
  project,
  username,
  displayName,
}: PublicResultsPanelProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const tierColor =
    TIER_CONFIG[evaluation.tier_confirmed as keyof typeof TIER_CONFIG]?.color || '#6C47FF'

  // Phase 1: Animate score counting
  useEffect(() => {
    const duration = 1200
    const steps = 60
    const increment = evaluation.score_total / steps
    const stepDuration = duration / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= evaluation.score_total) {
        setDisplayScore(evaluation.score_total)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [evaluation.score_total])

  const handleShare = () => {
    const url = `${window.location.origin}/badge/${project.id}`
    const text = `Check out "${project.title}" - Score: ${evaluation.score_total}/100 🎉`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank')
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/badge/${project.id}`
    navigator.clipboard.writeText(url)
    alert('Public project link copied!')
  }

  const circumference = 2 * Math.PI * 50
  const offset = circumference - (evaluation.score_total / 100) * circumference

  return (
    <div className="sticky top-6 space-y-6">
      {/* Score Card */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="mb-4 text-xs uppercase tracking-widest text-zinc-500">Evaluation Results</p>

        {/* Phase 1: Main Score Ring */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            <svg width="120" height="120" className="-rotate-90 transform">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke={tierColor}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.3,
                }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {displayScore}
              </motion.span>
              <span className="text-xs text-zinc-500">/ 100</span>
            </div>
          </div>
        </div>

        {/* Phase 2: Tier Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mb-6 flex justify-center"
        >
          <span
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{
              borderColor: tierColor,
              backgroundColor: `${tierColor}15`,
              color: tierColor,
            }}
          >
            <TierBadgeImage tier={evaluation.tier_confirmed} size={16} />
            {TIER_CONFIG[evaluation.tier_confirmed as keyof typeof TIER_CONFIG]?.label}
          </span>
        </motion.div>

        {/* Phase 3 & 4: Category Breakdown and Reviewer Note */}
        <div className="mb-6 space-y-2">
          {categoryConfig.map((cat, i) => (
            <div key={cat.key} className="flex items-center gap-2">
              <span className="flex-1 truncate text-xs text-zinc-500">{cat.label}</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(evaluation[cat.key] / cat.max) * 100}%` }}
                  transition={{
                    delay: 2.0 + i * 0.1,
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0 + i * 0.1, duration: 0.3 }}
                className="w-6 text-right text-xs font-bold text-white"
              >
                {evaluation[cat.key]}
              </motion.span>
            </div>
          ))}
        </div>

        {/* Reviewer Note */}
        <div className="mb-6 border-t border-white/[0.08] pt-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Reviewer Note</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
          >
            <p className="break-words text-sm italic leading-relaxed text-white">
              "{evaluation.reviewer_note}"
            </p>
            {evaluation.profiles && (
              <p className="mt-2 break-words text-xs text-zinc-600">
                — {evaluation.profiles.display_name || evaluation.profiles.username}
              </p>
            )}
          </motion.div>
        </div>

        {/* Action Buttons - No download for public */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.9, duration: 0.5 }}
          className="space-y-2"
        >
          <Button className="w-full" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Project
          </Button>
          <Button className="w-full" variant="outline" size="sm" onClick={handleCopyLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Copy Public Link
          </Button>
          {username && (
            <Link href={`/u/${username}`} className="block">
              <Button className="w-full" variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Profile
              </Button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Certificate Preview - No download button */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="mb-4 text-xs uppercase tracking-widest text-zinc-500">Certificate Preview</p>
        <CertificatePreview
          projectTitle={project.title}
          score={evaluation.score_total}
          tier={evaluation.tier_confirmed}
          evaluatedAt={evaluation.evaluated_at}
          userName={displayName || username}
          projectId={project.id}
        />
        <p className="mt-4 text-center text-xs text-zinc-600">
          Certificate download available to project owner only
        </p>
      </div>
    </div>
  )
}
