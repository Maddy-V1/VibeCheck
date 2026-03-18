'use client'

import Image from 'next/image'

const TIER_CONFIG = {
  tier1: { label: 'Tier 1 — Foundational', color: '#00F5A0' },
  tier2: { label: 'Tier 2 — Builder', color: '#00E5FF' },
  tier3: { label: 'Tier 3 — Architect', color: '#6C47FF' },
}

interface CertificatePreviewProps {
  projectTitle: string
  score: number
  tier: string
  evaluatedAt: string
  userName?: string | undefined
  projectId?: string
}

export function CertificatePreview({
  projectTitle,
  score,
  tier,
  evaluatedAt,
  userName,
  projectId,
}: CertificatePreviewProps) {
  const tierColor = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.color || '#6C47FF'
  const tierLabel = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.label || tier
  const tierNumber = tier.replace('tier', '')

  return (
    <div
      className="relative aspect-[1.414/1] w-full overflow-hidden rounded-lg border-2 bg-white shadow-sm"
      style={{ borderColor: tierColor }}
    >
      {/* Certificate Content - Matching PDF layout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        {/* Inner border */}
        <div className="absolute inset-3 rounded border border-gray-300" />

        {/* Decorative corners */}
        <div
          className="absolute left-4 top-4 h-3 w-3"
          style={{ borderTop: `1.5px solid ${tierColor}`, borderLeft: `1.5px solid ${tierColor}` }}
        />
        <div
          className="absolute right-4 top-4 h-3 w-3"
          style={{ borderTop: `1.5px solid ${tierColor}`, borderRight: `1.5px solid ${tierColor}` }}
        />
        <div
          className="absolute bottom-4 left-4 h-3 w-3"
          style={{
            borderBottom: `1.5px solid ${tierColor}`,
            borderLeft: `1.5px solid ${tierColor}`,
          }}
        />
        <div
          className="absolute bottom-4 right-4 h-3 w-3"
          style={{
            borderBottom: `1.5px solid ${tierColor}`,
            borderRight: `1.5px solid ${tierColor}`,
          }}
        />

        {/* Brand */}
        <div className="z-10 mb-1">
          <div className="text-sm font-bold tracking-tight" style={{ color: tierColor }}>
            VibeCheck
          </div>
        </div>

        {/* Certificate title */}
        <div className="mb-1 text-[7px] font-normal uppercase tracking-widest text-gray-600">
          Certificate of Achievement
        </div>

        {/* Divider */}
        <div className="mb-2 h-[0.5px] w-10" style={{ backgroundColor: tierColor }} />

        {/* Recipient section */}
        <div className="mb-0.5 text-[6px] text-gray-700">This is to certify that</div>

        <div className="mb-0.5 line-clamp-1 px-2 text-[9px] font-bold text-black">
          {userName || '[Recipient Name]'}
        </div>

        <div className="mb-0.5 text-[6px] text-gray-700">
          has successfully completed the project
        </div>

        {/* Project Title */}
        <h3 className="mb-1 line-clamp-2 px-3 text-[8px] font-bold leading-tight text-black">
          {projectTitle}
        </h3>

        <div className="mb-0.5 text-[6px] text-gray-700">and achieved an evaluation score of</div>

        {/* Score */}
        <div className="mb-1 flex items-baseline justify-center gap-0.5">
          <span className="text-xl font-bold" style={{ color: tierColor }}>
            {score}
          </span>
          <span className="text-[9px] text-gray-600">/ 100</span>
        </div>

        {/* Tier Badge with Logo inside */}
        <div
          className="mb-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest"
          style={{
            borderColor: tierColor,
            backgroundColor: `${tierColor}15`,
            color: tierColor,
          }}
        >
          <Image
            src={`/tiers/tier${tierNumber}.png`}
            alt={`Tier ${tierNumber}`}
            width={10}
            height={10}
            className="inline-block"
            unoptimized
          />
          {tierLabel}
        </div>

        {/* Date */}
        <div className="mb-1 text-[6px] text-gray-600">
          Issued on{' '}
          {new Date(evaluatedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <div className="text-[5px] leading-tight text-gray-500">
            Verify at vibecheck.app/badge/{projectId ? projectId.substring(0, 8) : '[id]'}
          </div>
        </div>
      </div>
    </div>
  )
}
