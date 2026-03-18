import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-[12px] font-medium leading-none text-zinc-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }
