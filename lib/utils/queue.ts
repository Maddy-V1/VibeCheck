const EVALUATIONS_PER_DAY = 30 // Phase 1 team capacity

export function calculateETA(position: number): number {
  return Math.ceil(position / EVALUATIONS_PER_DAY)
}

export function formatETA(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '~1 day'
  if (days <= 7) return `~${days} days`
  const weeks = Math.ceil(days / 7)
  return weeks === 1 ? '~1 week' : `~${weeks} weeks`
}
