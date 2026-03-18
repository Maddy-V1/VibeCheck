'use client'

import { motion } from 'framer-motion'
import { Clock, Zap } from 'lucide-react'
import { useQueuePosition } from '@/hooks/useQueuePosition'
import { formatETA } from '@/lib/utils/queue'
import { cn } from '@/lib/utils/cn'

interface QueuePositionBadgeProps {
  projectId: string
  initialPosition: number
  initialEstimatedDays: number
  plan?: 'free' | 'priority'
  variant?: 'compact' | 'full'
}

export function QueuePositionBadge({
  projectId,
  initialPosition,
  initialEstimatedDays,
  plan = 'free',
  variant = 'full',
}: QueuePositionBadgeProps) {
  const queueData = useQueuePosition(projectId, {
    position: initialPosition,
    estimated_days: initialEstimatedDays,
  })

  if (!queueData) return null

  const isPriority = plan === 'priority'

  if (variant === 'compact') {
    return (
      <motion.div
        key={queueData.position}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
          isPriority
            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
            : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
        )}
      >
        {isPriority && <Zap className="h-3 w-3" />}
        <span>#{queueData.position} in queue</span>
      </motion.div>
    )
  }

  return (
    <motion.div layout className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">Queue Status</p>
          <div className="flex items-center gap-2">
            <motion.p
              key={queueData.position}
              initial={{ scale: 1.2, color: '#818CF8' }}
              animate={{ scale: 1, color: '#FFFFFF' }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-white"
            >
              #{queueData.position}
            </motion.p>
            {isPriority && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                <Zap className="h-3 w-3" />
                Priority
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">Estimated</p>
          <div className="flex items-center gap-1.5 text-white">
            <Clock className="h-4 w-4 text-zinc-500" />
            <p className="text-[13px] font-semibold">{formatETA(queueData.estimated_days)}</p>
          </div>
        </div>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(((30 - queueData.position) / 30) * 100, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <p className="mt-3 text-[11px] text-zinc-600">
        We'll notify you by email and in-app when your evaluation is ready
      </p>
    </motion.div>
  )
}
