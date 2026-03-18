import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
        secondary: 'border-white/[0.08] bg-white/[0.04] text-zinc-400',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
        destructive: 'border-red-500/20 bg-red-500/10 text-red-400',
        outline: 'border-white/[0.12] bg-transparent text-zinc-400',
        tier1: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
        tier2: 'border-sky-500/25 bg-sky-500/10 text-sky-400',
        tier3: 'border-violet-500/25 bg-violet-500/10 text-violet-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
