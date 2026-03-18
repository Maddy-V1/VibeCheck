'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Download, Share2, ExternalLink, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { CertificatePreview } from '@/components/features/evaluation/CertificatePreview'
import { TierBadgeImage } from '@/components/ui/tier-badge-image'

const categoryConfig = [
  { key: 'score_functionality', label: 'Functionality', max: 25, color: '#818CF8' },
  { key: 'score_ux', label: 'UX & Design', max: 20, color: '#06B6D4' },
  { key: 'score_complexity', label: 'Complexity', max: 20, color: '#38BDF8' },
  { key: 'score_deployment', label: 'Deployment', max: 10, color: '#34D399' },
  { key: 'score_code_quality', label: 'Code Quality', max: 10, color: '#FBBF24' },
  { key: 'score_documentation', label: 'Documentation', max: 8, color: '#FB7185' },
  { key: 'score_originality', label: 'Originality', max: 7, color: '#A78BFA' },
]

const TIER_CONFIG = {
  tier1: { label: 'Tier 1 — Foundational', color: '#34D399' },
  tier2: { label: 'Tier 2 — Builder', color: '#38BDF8' },
  tier3: { label: 'Tier 3 — Architect', color: '#818CF8' },
}

interface ProjectResultsPanelProps {
  evaluation: any
  project: any
  username?: string | undefined
  displayName?: string | undefined
}

export function ProjectResultsPanel({
  evaluation,
  project,
  username,
  displayName,
}: ProjectResultsPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const [copied, setCopied] = useState(false)
  const tierColor =
    TIER_CONFIG[evaluation.tier_confirmed as keyof typeof TIER_CONFIG]?.color || '#818CF8'

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

  const handleDownloadCertificate = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/certificates/download?projectId=${project.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_Certificate.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/badge/${project.id}`
    const text = `Check out my project "${project.title}" - Score: ${evaluation.score_total}/100 🎉`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    )
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/badge/${project.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const circumference = 2 * Math.PI * 50
  const offset = circumference - (evaluation.score_total / 100) * circumference

  return (
    <div className="sticky top-6 space-y-4">
      {/* Score Card */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
        <p className="mb-4 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
          Evaluation Results
        </p>

        {/* Score Ring */}
        <div className="mb-5 flex items-center justify-center">
          <div className="relative">
            <svg width="120" height="120" className="-rotate-90 transform">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="rgba(255, 255, 255, 0.06)"
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
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                style={{ strokeDasharray: circumference }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-bold tabular-nums text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {displayScore}
              </motion.span>
              <span className="text-[10px] text-zinc-600">/ 100</span>
            </div>
          </div>
        </div>

        {/* Tier Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mb-5 flex justify-center"
        >
          <span
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ borderColor: tierColor, backgroundColor: `${tierColor}15`, color: tierColor }}
          >
            <TierBadgeImage tier={evaluation.tier_confirmed} size={14} />
            {TIER_CONFIG[evaluation.tier_confirmed as keyof typeof TIER_CONFIG]?.label}
          </span>
        </motion.div>

        {/* Category Breakdown */}
        <div className="mb-5 space-y-2">
          {categoryConfig.map((cat, i) => (
            <div key={cat.key} className="flex items-center gap-2">
              <span className="flex-1 truncate text-[11px] text-zinc-500">{cat.label}</span>
              <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(evaluation[cat.key] / cat.max) * 100}%` }}
                  transition={{ delay: 2.0 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0 + i * 0.1, duration: 0.3 }}
                className="w-5 text-right text-[11px] font-bold tabular-nums text-white"
              >
                {evaluation[cat.key]}
              </motion.span>
            </div>
          ))}
        </div>

        {/* Reviewer Note */}
        <div className="mb-5 border-t border-white/[0.06] pt-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            Reviewer Note
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
          >
            <p className="break-words text-[13px] italic leading-relaxed text-zinc-300">
              &quot;{evaluation.reviewer_note}&quot;
            </p>
            {evaluation.profiles && (
              <p className="mt-2 break-words text-[11px] text-zinc-600">
                — {evaluation.profiles.display_name || evaluation.profiles.username}
              </p>
            )}
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.5 }}
          className="space-y-2"
        >
          <Button className="w-full" size="sm" onClick={handleShare}>
            <Share2 size={12} className="mr-1.5" /> Share on X
          </Button>
          <Button className="w-full" variant="secondary" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <Check size={12} className="mr-1.5" />
            ) : (
              <Copy size={12} className="mr-1.5" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          {username && (
            <Link href={`/u/${username}`} className="block">
              <Button className="w-full" variant="ghost" size="sm">
                <ExternalLink size={12} className="mr-1.5" /> Public Profile
              </Button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Certificate Preview */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
        <p className="mb-4 text-[11px] uppercase tracking-[0.12em] text-zinc-500">Certificate</p>
        <CertificatePreview
          projectTitle={project.title}
          score={evaluation.score_total}
          tier={evaluation.tier_confirmed}
          evaluatedAt={evaluation.evaluated_at}
          userName={displayName || username}
          projectId={project.id}
        />
        <Button
          className="mt-4 w-full"
          variant="secondary"
          size="sm"
          onClick={handleDownloadCertificate}
          disabled={isDownloading}
        >
          <Download size={12} className="mr-1.5" />
          {isDownloading ? 'Downloading…' : 'Download PDF'}
        </Button>
      </div>
    </div>
  )
}
