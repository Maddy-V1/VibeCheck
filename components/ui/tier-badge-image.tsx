'use client'

import Image from 'next/image'

interface TierBadgeImageProps {
  tier: string
  size?: number
  className?: string
}

export function TierBadgeImage({ tier, size = 24, className = '' }: TierBadgeImageProps) {
  const badgeUrl = `/tiers/tier${tier.replace('tier', '')}.png`

  return (
    <Image
      src={badgeUrl}
      alt={`${tier} badge`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      unoptimized
    />
  )
}
