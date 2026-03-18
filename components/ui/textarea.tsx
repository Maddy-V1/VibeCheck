import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white transition-colors placeholder:text-zinc-600',
          'focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
