import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  label?: React.ReactNode
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, onCheckedChange, ...props }, ref) => {
    return (
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border border-white/[0.15] bg-white/[0.04] accent-indigo-500',
            'focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-40',
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="cursor-pointer text-[13px] leading-snug text-zinc-500">
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
